import { type Action, type TextTemplate, rawAction } from '../step';

export function alert({ title, message }: { title: string | TextTemplate; message: string | TextTemplate }): Action {
  return rawAction('is.workflow.actions.alert', { WFAlertActionMessage: message, WFAlertActionTitle: title });
}
