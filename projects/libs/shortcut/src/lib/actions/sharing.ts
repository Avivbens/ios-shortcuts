import { type Action, type Reference, rawAction } from '../step';

export function setClipboard(input: Reference): Action {
  return rawAction('is.workflow.actions.setclipboard', { WFInput: input });
}
