import { describe, expect, it } from 'vitest';
import { ENVELOPE } from '../mocks/shortcut-envelope.mock';
import { createShortcut } from './create-shortcut';
import { outputOf, shortcutInput, text, variable } from './references';
import { type Action, type Step, controlFlow, rawAction } from './step';

function comment(message: string): Action {
  return rawAction('is.workflow.actions.comment', { WFCommentActionText: message });
}

function parametersOf(steps: Step[]): Record<string, unknown>[] {
  return createShortcut(ENVELOPE, steps).WFWorkflowActions.map((action) => action.WFWorkflowActionParameters);
}

describe('create-shortcut', () => {
  describe('createShortcut', () => {
    it('should keep the envelope and append the actions in order', () => {
      expect(createShortcut(ENVELOPE, [comment('Hello')])).toEqual({
        ...ENVELOPE,
        WFWorkflowActions: [
          {
            WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
            WFWorkflowActionParameters: { WFCommentActionText: 'Hello' },
          },
        ],
      });
    });

    it('should give an action with an output a UUID, and point references at it', () => {
      const question = rawAction(
        'is.workflow.actions.ask',
        { WFAskActionPrompt: 'Text?' },
        { outputName: 'Provided Input' },
      );

      const [ask, store] = parametersOf([
        question,
        rawAction('is.workflow.actions.setvariable', { WFInput: outputOf(question), WFVariableName: 'Text' }),
      ]);

      expect(store).toEqual({
        WFInput: {
          Value: { OutputName: 'Provided Input', OutputUUID: ask?.['UUID'], Type: 'ActionOutput' },
          WFSerializationType: 'WFTextTokenAttachment',
        },
        WFVariableName: 'Text',
      });
      expect(ask?.['UUID']).toMatch(/^[0-9A-F-]{36}$/);
    });

    it('should serialize a variable and the shortcut input as Shortcuts stores them', () => {
      const [fromVariable, fromInput] = parametersOf([
        rawAction('is.workflow.actions.setclipboard', { WFInput: variable('Results') }),
        rawAction('is.workflow.actions.setvariable', { WFInput: shortcutInput(), WFVariableName: 'TextToTranslate' }),
      ]);

      expect(fromVariable?.['WFInput']).toEqual({
        Value: { Type: 'Variable', VariableName: 'Results' },
        WFSerializationType: 'WFTextTokenAttachment',
      });
      expect(fromInput?.['WFInput']).toEqual({
        Value: { Type: 'ExtensionInput' },
        WFSerializationType: 'WFTextTokenAttachment',
      });
    });

    it('should place each text reference at its UTF-16 offset, as in the decoded Translate Text alert', () => {
      const [alert] = parametersOf([
        rawAction('is.workflow.actions.alert', { WFAlertActionTitle: text`Translated to ${variable('TranslateTo')}` }),
      ]);

      expect(alert?.['WFAlertActionTitle']).toEqual({
        Value: {
          attachmentsByRange: { '{14, 1}': { Type: 'Variable', VariableName: 'TranslateTo' } },
          string: 'Translated to \uFFFC',
        },
        WFSerializationType: 'WFTextTokenString',
      });
    });

    it('should count an emoji outside the BMP as two units, since Shortcuts offsets are UTF-16', () => {
      const [action] = parametersOf([
        rawAction('is.workflow.actions.gettext', { WFTextActionText: text`🌍 ${variable('a')} ${variable('b')}` }),
      ]);

      expect(action?.['WFTextActionText']).toMatchObject({
        Value: { attachmentsByRange: { '{3, 1}': { VariableName: 'a' }, '{5, 1}': { VariableName: 'b' } } },
      });
    });

    it('should flatten a block into a start, its sections and an end that share one grouping identifier', () => {
      const actions = createShortcut(ENVELOPE, [
        controlFlow(
          'is.workflow.actions.choosefrommenu',
          { WFMenuItems: ['Clipboard', 'Free-Style'], WFMenuPrompt: 'What to translate?' },
          [
            { marker: { WFMenuItemTitle: 'Clipboard' }, steps: [comment('inside')] },
            { marker: { WFMenuItemTitle: 'Free-Style' }, steps: [] },
          ],
          { outputName: 'Menu Result' },
        ),
      ]).WFWorkflowActions.map((action) => action.WFWorkflowActionParameters);

      const grouping = actions[0]?.['GroupingIdentifier'];
      expect(actions.map((action) => action['WFControlFlowMode'])).toEqual([0, 1, undefined, 1, 2]);
      expect(
        actions.filter((action) => 'GroupingIdentifier' in action).map((action) => action['GroupingIdentifier']),
      ).toEqual([grouping, grouping, grouping, grouping]);
      expect(actions[4]).toEqual({ GroupingIdentifier: grouping, UUID: expect.any(String), WFControlFlowMode: 2 });
    });

    it('should build the same UUIDs on every run, so a rebuild changes nothing', () => {
      function build(): ReturnType<typeof createShortcut> {
        const question = rawAction('is.workflow.actions.ask', {}, { outputName: 'Provided Input' });

        return createShortcut(ENVELOPE, [
          question,
          rawAction('is.workflow.actions.setclipboard', { WFInput: outputOf(question) }),
        ]);
      }

      expect(build()).toEqual(build());
    });

    it("should give an import question the position of the action it names, as Shortcuts' ActionIndex", () => {
      const amount = rawAction('is.workflow.actions.gettext', { WFTextActionText: '5' }, { outputName: 'Text' });
      const question = {
        Category: 'Parameter',
        DefaultValue: '5',
        ParameterKey: 'WFTextActionText',
        Text: 'Amount of results ',
      };

      const shortcut = createShortcut({ ...ENVELOPE, WFWorkflowImportQuestions: [{ ...question, step: amount }] }, [
        controlFlow('is.workflow.actions.choosefrommenu', { WFMenuItems: ['A'], WFMenuPrompt: 'Pick' }, [
          { marker: { WFMenuItemTitle: 'A' }, steps: [comment('inside')] },
        ]),
        comment('Setup number of results'),
        amount,
      ]);

      expect(shortcut.WFWorkflowImportQuestions).toEqual([{ ActionIndex: 5, ...question }]);
    });

    it('should refuse an import question about an action that is not part of the shortcut', () => {
      const missing = rawAction('is.workflow.actions.gettext', { WFTextActionText: '5' }, { outputName: 'Text' });
      const question = { Category: 'Parameter', DefaultValue: '5', ParameterKey: 'WFTextActionText', Text: 'Amount' };

      expect(() =>
        createShortcut({ ...ENVELOPE, WFWorkflowImportQuestions: [{ ...question, step: missing }] }, [comment('a')]),
      ).toThrow('is.workflow.actions.gettext has an import question but is not part of the shortcut');
    });

    it('should refuse a reference to an action that is not part of the shortcut', () => {
      const missing = rawAction('is.workflow.actions.ask', {}, { outputName: 'Provided Input' });

      expect(() =>
        createShortcut(ENVELOPE, [rawAction('is.workflow.actions.setclipboard', { WFInput: outputOf(missing) })]),
      ).toThrow('is.workflow.actions.ask is referenced but not part of the shortcut');
    });
  });
});
