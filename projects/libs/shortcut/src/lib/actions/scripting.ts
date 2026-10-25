import { type Action, type Block, type Reference, type Step, controlFlow, rawAction } from '../step';

export type MenuItem = [title: string, steps: Step[]];

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
