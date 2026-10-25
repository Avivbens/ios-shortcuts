import { type Action, type Reference, type TextTemplate, rawAction } from '../step';

export function getContentsOfUrl(address: string | TextTemplate): Action {
  return rawAction('is.workflow.actions.downloadurl', { WFURL: address }, { outputName: 'Contents of URL' });
}

export function url(address: string | TextTemplate): Action {
  return rawAction('is.workflow.actions.url', { WFURLActionURL: address }, { outputName: 'URL' });
}

export function getWebPageContents(input: Reference | TextTemplate): Action {
  return rawAction(
    'is.workflow.actions.getwebpagecontents',
    { WFInput: input },
    { outputName: 'Contents of Web Page' },
  );
}

export function openUrl(input: Reference | TextTemplate): Action {
  return rawAction('is.workflow.actions.openurl', { WFInput: input });
}
