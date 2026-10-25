import { type ShortcutAction, type ShortcutWorkflow, ShortcutWorkflowSchema } from '@ios-shortcuts/shortcut-plist';
import {
  type Block,
  type ParameterValue,
  type Parameters,
  type Reference,
  type Step,
  type TextTemplate,
  isReference,
  isTextTemplate,
} from './step';
import { createUuidSequence } from './uuid';

type ImportQuestion = ShortcutWorkflow['WFWorkflowImportQuestions'][number];

/** Shortcuts finds a question's action by position, so a question names the action and the build counts its place. */
export type ShortcutImportQuestion = Omit<ImportQuestion, 'ActionIndex'> & { step: Step };

export type ShortcutEnvelope = Omit<ShortcutWorkflow, 'WFWorkflowActions' | 'WFWorkflowImportQuestions'> & {
  WFWorkflowImportQuestions: ShortcutImportQuestion[];
};

/** Shortcuts marks every reference inside a text with this character, one UTF-16 unit long. */
const OBJECT_REPLACEMENT_CHARACTER = '\uFFFC';

const CONTROL_FLOW_MODE = { start: 0, section: 1, end: 2 } as const;

interface BuildContext {
  steps: Set<Step>;
  uuidOf: (step: Step) => string;
  nextUuid: () => string;
  origins: Map<ShortcutAction, Step>;
}

function collectSteps(steps: Step[]): Step[] {
  return steps.flatMap((step) =>
    step.kind === 'block' ? [step, ...collectSteps(step.sections.flatMap((section) => section.steps))] : [step],
  );
}

function toAttachment(reference: Reference, context: BuildContext): Record<string, string> {
  switch (reference.kind) {
    case 'variable':
      return { Type: 'Variable', VariableName: reference.name };
    case 'shortcut-input':
      return { Type: 'ExtensionInput' };
    case 'output':
      return {
        OutputName: reference.step.outputName ?? '',
        OutputUUID: context.uuidOf(reference.step),
        Type: 'ActionOutput',
      };
  }
}

function toTokenString(template: TextTemplate, context: BuildContext): Record<string, unknown> {
  const chunks = template.segments.map((segment) => (isReference(segment) ? OBJECT_REPLACEMENT_CHARACTER : segment));
  const attachmentsByRange = Object.fromEntries(
    template.segments.flatMap((segment, index) =>
      isReference(segment) ? [[`{${chunks.slice(0, index).join('').length}, 1}`, toAttachment(segment, context)]] : [],
    ),
  );

  return { Value: { attachmentsByRange, string: chunks.join('') }, WFSerializationType: 'WFTextTokenString' };
}

function resolveValue(value: ParameterValue, context: BuildContext): unknown {
  if (isReference(value)) {
    return { Value: toAttachment(value, context), WFSerializationType: 'WFTextTokenAttachment' };
  }

  if (isTextTemplate(value)) {
    return toTokenString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }

  if (typeof value === 'object') {
    return resolveParameters(value, context);
  }

  return value;
}

function resolveParameters(parameters: Parameters, context: BuildContext): Record<string, unknown> {
  return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, resolveValue(value, context)]));
}

function toBlockActions(block: Block, context: BuildContext): ShortcutAction[] {
  const grouping = { GroupingIdentifier: context.nextUuid() };
  const action = (parameters: Record<string, unknown>): ShortcutAction => ({
    WFWorkflowActionIdentifier: block.identifier,
    WFWorkflowActionParameters: { ...grouping, ...parameters },
  });

  const start = action({ ...resolveParameters(block.start, context), WFControlFlowMode: CONTROL_FLOW_MODE.start });
  context.origins.set(start, block);

  return [
    start,
    ...block.sections.flatMap((section) => [
      ...(section.marker
        ? [action({ ...resolveParameters(section.marker, context), WFControlFlowMode: CONTROL_FLOW_MODE.section })]
        : []),
      ...section.steps.flatMap((step) => toActions(step, context)),
    ]),
    action({
      ...(block.outputName === undefined ? {} : { UUID: context.uuidOf(block) }),
      WFControlFlowMode: CONTROL_FLOW_MODE.end,
    }),
  ];
}

function toActions(step: Step, context: BuildContext): ShortcutAction[] {
  if (step.kind === 'block') {
    return toBlockActions(step, context);
  }

  const action: ShortcutAction = {
    WFWorkflowActionIdentifier: step.identifier,
    WFWorkflowActionParameters: {
      ...resolveParameters(step.parameters, context),
      ...(step.outputName === undefined ? {} : { UUID: context.uuidOf(step) }),
    },
  };
  context.origins.set(action, step);

  return [action];
}

export function createShortcut(envelope: ShortcutEnvelope, steps: Step[]): ShortcutWorkflow {
  const nextUuid = createUuidSequence();
  const uuids = new Map<Step, string>();
  const context: BuildContext = {
    steps: new Set(collectSteps(steps)),
    nextUuid,
    origins: new Map(),
    uuidOf(step) {
      if (!context.steps.has(step)) {
        throw new Error(`${step.identifier} is referenced but not part of the shortcut`);
      }

      const uuid = uuids.get(step) ?? nextUuid();
      uuids.set(step, uuid);

      return uuid;
    },
  };

  const actions = steps.flatMap((step) => toActions(step, context));
  const positions = new Map(
    actions.flatMap((action, index) => {
      const step = context.origins.get(action);

      return step === undefined ? [] : [[step, index] as const];
    }),
  );

  function positionOf(step: Step): number {
    const position = positions.get(step);
    if (position === undefined) {
      throw new Error(`${step.identifier} has an import question but is not part of the shortcut`);
    }

    return position;
  }

  return ShortcutWorkflowSchema.parse({
    ...envelope,
    WFWorkflowActions: actions,
    WFWorkflowImportQuestions: envelope.WFWorkflowImportQuestions.map(({ step, ...question }) => ({
      ActionIndex: positionOf(step),
      ...question,
    })),
  });
}
