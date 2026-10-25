import { type Action, type TextTemplate, rawAction } from '../step';

/** The Text action; a custom `name` is what references to its output show. */
export function textAction(content: string | TextTemplate, { name }: { name?: string } = {}): Action {
  return rawAction(
    'is.workflow.actions.gettext',
    { WFTextActionText: content, ...(name === undefined ? {} : { CustomOutputName: name }) },
    { outputName: name ?? 'Text' },
  );
}
