import { z } from 'zod';
import type { ShortcutWorkflow } from '@ios-shortcuts/shortcut-plist';

const SET_VARIABLE = 'is.workflow.actions.setvariable';
const GET_TEXT = 'is.workflow.actions.gettext';

const SetVariableParametersSchema = z.looseObject({
  WFVariableName: z.string(),
  WFInput: z.looseObject({
    Value: z.looseObject({ OutputUUID: z.string() }),
  }),
});

const TextParametersSchema = z.looseObject({
  UUID: z.string(),
  WFTextActionText: z.string(),
});

/**
 * A variable is set from another action's output, linked by `OutputUUID`. Only a plain Text action counts as the
 * source - a variable set any other way cannot be stamped, so finding the `setvariable` but no such source throws.
 */
function getVariableSourceIndex(workflow: ShortcutWorkflow, name: string): number | undefined {
  const outputId = workflow.WFWorkflowActions.filter((action) => action.WFWorkflowActionIdentifier === SET_VARIABLE)
    .map((action) => SetVariableParametersSchema.safeParse(action.WFWorkflowActionParameters).data)
    .find((parameters) => parameters?.WFVariableName === name)?.WFInput.Value.OutputUUID;

  if (!outputId) {
    return undefined;
  }

  const index = workflow.WFWorkflowActions.findIndex(
    (action) =>
      action.WFWorkflowActionIdentifier === GET_TEXT &&
      TextParametersSchema.safeParse(action.WFWorkflowActionParameters).data?.UUID === outputId,
  );

  if (index === -1) {
    throw new Error(`${name} is not set from a plain Text action`);
  }

  return index;
}

export function getVariableText(workflow: ShortcutWorkflow, name: string): string | undefined {
  const index = getVariableSourceIndex(workflow, name);
  if (index === undefined) {
    return undefined;
  }

  return TextParametersSchema.parse(workflow.WFWorkflowActions[index]?.WFWorkflowActionParameters).WFTextActionText;
}

export function setVariableText(workflow: ShortcutWorkflow, name: string, text: string): ShortcutWorkflow {
  const index = getVariableSourceIndex(workflow, name);
  if (index === undefined) {
    return workflow;
  }

  return {
    ...workflow,
    WFWorkflowActions: workflow.WFWorkflowActions.map((action, actionIndex) =>
      actionIndex === index
        ? { ...action, WFWorkflowActionParameters: { ...action.WFWorkflowActionParameters, WFTextActionText: text } }
        : action,
    ),
  };
}
