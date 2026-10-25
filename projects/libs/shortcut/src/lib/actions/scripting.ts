import { type Action, type Block, type Reference, type Step, type TextTemplate, controlFlow, rawAction } from '../step';

export type MenuItem = [title: string, steps: Step[]];

/** Shortcuts' code for the "is" comparison, the only one AI Response uses. */
const CONDITION_IS = 4;

export function comment(message: string): Action {
  return rawAction('is.workflow.actions.comment', { WFCommentActionText: message });
}

export function setVariable(name: string, value: Reference): Action {
  return rawAction('is.workflow.actions.setvariable', { WFInput: value, WFVariableName: name });
}

export function ask({ prompt, inputType }: { prompt: string; inputType?: string }): Action {
  return rawAction(
    'is.workflow.actions.ask',
    { WFAskActionPrompt: prompt, ...(inputType === undefined ? {} : { WFInputType: inputType }) },
    { outputName: 'Ask for Input' },
  );
}

export function list(items: string[]): Action {
  return rawAction('is.workflow.actions.list', { WFItems: items }, { outputName: 'List' });
}

export function chooseFromList(input: Reference): Action {
  return rawAction('is.workflow.actions.choosefromlist', { WFInput: input }, { outputName: 'Selected Item' });
}

export function menu(prompt: string, items: MenuItem[]): Block {
  return controlFlow(
    'is.workflow.actions.choosefrommenu',
    { WFMenuItems: items.map(([title]) => title), WFMenuPrompt: prompt },
    items.map(([title, steps]) => ({ marker: { WFMenuItemTitle: title }, steps })),
  );
}

/** Shortcuts stores both bounds as strings. */
export function randomNumber({ minimum, maximum }: { minimum: number; maximum: number }): Action {
  return rawAction(
    'is.workflow.actions.number.random',
    { WFRandomNumberMaximum: String(maximum), WFRandomNumberMinimum: String(minimum) },
    { outputName: 'Random Number' },
  );
}

/** A number is compared as a number and a string as text, each under the key Shortcuts uses for it. */
export function ifEquals(input: Reference, value: string | number, steps: Step[]): Block {
  return controlFlow(
    'is.workflow.actions.conditional',
    {
      WFCondition: CONDITION_IS,
      WFInput: { Type: 'Variable', Variable: input },
      ...(typeof value === 'number' ? { WFNumberValue: String(value) } : { WFConditionalActionString: value }),
    },
    [{ steps }],
  );
}

export function exit(): Action {
  return rawAction('is.workflow.actions.exit', {});
}

export function getDictionaryValue(
  input: Reference,
  key: string | TextTemplate,
  { valueType }: { valueType?: string } = {},
): Action {
  return rawAction(
    'is.workflow.actions.getvalueforkey',
    {
      WFDictionaryKey: key,
      ...(valueType === undefined ? {} : { WFGetDictionaryValueType: valueType }),
      WFInput: input,
    },
    { outputName: 'Dictionary Value' },
  );
}
