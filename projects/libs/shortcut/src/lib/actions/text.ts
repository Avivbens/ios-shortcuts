import { type Action, type Reference, type TextTemplate, rawAction } from '../step';

/** The Text action; a custom `name` is what references to its output show. */
export function textAction(content: string | TextTemplate, { name }: { name?: string } = {}): Action {
  return rawAction(
    'is.workflow.actions.gettext',
    { WFTextActionText: content, ...(name === undefined ? {} : { CustomOutputName: name }) },
    { outputName: name ?? 'Text' },
  );
}

export function getTextFromInput(input: Reference, { name }: { name?: string } = {}): Action {
  return rawAction(
    'is.workflow.actions.detect.text',
    { ...(name === undefined ? {} : { CustomOutputName: name }), WFInput: input },
    { outputName: name ?? 'Text' },
  );
}

export function replaceText(
  input: Reference | TextTemplate,
  { find, replaceWith }: { find: string; replaceWith?: string },
): Action {
  return rawAction(
    'is.workflow.actions.text.replace',
    {
      WFInput: input,
      WFReplaceTextFind: find,
      ...(replaceWith === undefined ? {} : { WFReplaceTextReplace: replaceWith }),
    },
    { outputName: 'Updated Text' },
  );
}

export function splitText(input: Reference, { separator }: { separator: string }): Action {
  return rawAction(
    'is.workflow.actions.text.split',
    { WFTextCustomSeparator: separator, WFTextSeparator: 'Custom', text: input },
    { outputName: 'Split Text' },
  );
}

export function trimWhitespace(input: Reference | TextTemplate): Action {
  return rawAction('is.workflow.actions.text.trimwhitespace', { WFInput: input }, { outputName: 'Updated Text' });
}
