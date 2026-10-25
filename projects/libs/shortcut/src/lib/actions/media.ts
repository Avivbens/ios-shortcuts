import { type Action, type Reference, rawAction } from '../step';

export function takeScreenshot(): Action {
  return rawAction('is.workflow.actions.takescreenshot', {}, { outputName: 'Screenshot' });
}

export function extractTextFromImage(image: Reference): Action {
  return rawAction('is.workflow.actions.extracttextfromimage', { WFImage: image }, { outputName: 'Text from Image' });
}
