import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf, shortcutInput } from '../references';
import { ask, chooseFromList, comment, list, menu, setVariable } from './scripting';

/** Expected values are the decoded Translate Text shortcut's actions 2 to 11; UUIDs are matched, not copied. */
describe('scripting', () => {
  describe('comment', () => {
    it('should store the comment text', () => {
      expect(parametersOf([comment('What to translate?')])).toEqual([{ WFCommentActionText: 'What to translate?' }]);
    });
  });

  describe('setVariable', () => {
    it('should store the shortcut input under a variable name', () => {
      expect(parametersOf([setVariable('TextToTranslate', shortcutInput())])).toEqual([
        {
          WFInput: { Value: { Type: 'ExtensionInput' }, WFSerializationType: 'WFTextTokenAttachment' },
          WFVariableName: 'TextToTranslate',
        },
      ]);
    });
  });

  describe('ask', () => {
    it('should ask for text with a prompt', () => {
      expect(parametersOf([ask({ prompt: 'What do you want to translate?', inputType: 'Text' })])).toEqual([
        { UUID: expect.any(String), WFAskActionPrompt: 'What do you want to translate?', WFInputType: 'Text' },
      ]);
    });
  });

  describe('list and chooseFromList', () => {
    it('should offer the list output to choose from, referenced as "List"', () => {
      const languages = list(['Hebrew', 'English', 'Dutch ']);

      const [listed, chosen] = parametersOf([languages, chooseFromList(outputOf(languages))]);

      expect(listed).toEqual({ UUID: expect.any(String), WFItems: ['Hebrew', 'English', 'Dutch '] });
      expect(chosen).toEqual({
        UUID: expect.any(String),
        WFInput: {
          Value: { OutputName: 'List', OutputUUID: listed?.['UUID'], Type: 'ActionOutput' },
          WFSerializationType: 'WFTextTokenAttachment',
        },
      });
    });

    it('should name the chosen item "Selected Item" for later references', () => {
      const languages = list(['Hebrew']);
      const language = chooseFromList(outputOf(languages));

      const [, , stored] = parametersOf([languages, language, setVariable('TranslateTo', outputOf(language))]);

      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'Selected Item' } });
    });
  });

  describe('menu', () => {
    it('should open with the prompt and items, then mark each item before its steps', () => {
      const question = ask({ prompt: 'What do you want to translate?', inputType: 'Text' });

      const actions = parametersOf([
        menu('What to translate?', [
          ['Clipboard', [setVariable('TextToTranslate', shortcutInput())]],
          ['Free-Style', [question, setVariable('TextToTranslate', outputOf(question))]],
        ]),
      ]);

      const grouping = actions[0]?.['GroupingIdentifier'];
      expect(actions[0]).toEqual({
        GroupingIdentifier: grouping,
        WFControlFlowMode: 0,
        WFMenuItems: ['Clipboard', 'Free-Style'],
        WFMenuPrompt: 'What to translate?',
      });
      expect(actions[1]).toEqual({ GroupingIdentifier: grouping, WFControlFlowMode: 1, WFMenuItemTitle: 'Clipboard' });
      expect(actions[3]).toEqual({ GroupingIdentifier: grouping, WFControlFlowMode: 1, WFMenuItemTitle: 'Free-Style' });
      expect(actions.at(-1)).toEqual({ GroupingIdentifier: grouping, WFControlFlowMode: 2 });
      expect(actions).toHaveLength(7);
    });
  });
});
