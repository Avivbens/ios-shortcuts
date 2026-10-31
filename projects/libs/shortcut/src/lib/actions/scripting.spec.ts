import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf, shortcutInput, text, variable } from '../references';
import {
  ask,
  chooseFromList,
  comment,
  exit,
  getDictionaryValue,
  ifEquals,
  list,
  menu,
  randomNumber,
  setVariable,
} from './scripting';

/** Expected values are the decoded Translate Text shortcut's actions 2 to 11; UUIDs are matched, not copied. */
describe('scripting', () => {
  describe('comment', () => {
    it('should store the comment text', () => {
      expect(parametersOf([comment('What to translate?')])).toEqual([{ WFCommentActionText: 'What to translate?' }]);
    });
  });

  describe('setVariable', () => {
    it('should store the shortcut input under a variable name', () => {
      expect(parametersOf([setVariable(variable('TextToTranslate'), shortcutInput())])).toEqual([
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

      const [, , stored] = parametersOf([
        languages,
        language,
        setVariable(variable('TranslateTo'), outputOf(language)),
      ]);

      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'Selected Item' } });
    });
  });

  describe('menu', () => {
    it('should open with the prompt and items, then mark each item before its steps', () => {
      const question = ask({ prompt: 'What do you want to translate?', inputType: 'Text' });

      const actions = parametersOf([
        menu('What to translate?', [
          ['Clipboard', [setVariable(variable('TextToTranslate'), shortcutInput())]],
          ['Free-Style', [question, setVariable(variable('TextToTranslate'), outputOf(question))]],
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

  describe('randomNumber', () => {
    it('should store both bounds as strings, as the decoded AI Response does', () => {
      expect(parametersOf([randomNumber({ minimum: 0, maximum: 10 })])).toEqual([
        { UUID: expect.any(String), WFRandomNumberMaximum: '10', WFRandomNumberMinimum: '0' },
      ]);
    });
  });

  describe('ifEquals', () => {
    it('should compare a number under WFNumberValue, as the update check rolls its die', () => {
      const die = randomNumber({ minimum: 0, maximum: 10 });

      const [rolled, start, inside, end] = parametersOf([die, ifEquals(outputOf(die), 5, [exit()])]);

      expect(start).toEqual({
        GroupingIdentifier: expect.any(String),
        WFCondition: 4,
        WFControlFlowMode: 0,
        WFInput: {
          Type: 'Variable',
          Variable: {
            Value: { OutputName: 'Random Number', OutputUUID: rolled?.['UUID'], Type: 'ActionOutput' },
            WFSerializationType: 'WFTextTokenAttachment',
          },
        },
        WFNumberValue: '5',
      });
      expect(inside).toEqual({});
      expect(end).toEqual({ GroupingIdentifier: start?.['GroupingIdentifier'], WFControlFlowMode: 2 });
    });

    it('should compare text under WFConditionalActionString', () => {
      const [start] = parametersOf([ifEquals(variable('shouldUpdate'), 'true', [])]);

      expect(start).toMatchObject({ WFCondition: 4, WFConditionalActionString: 'true' });
      expect(start).not.toHaveProperty('WFNumberValue');
    });

    it('should open the otherwise branch with an Otherwise action in the same group', () => {
      const [start, then, otherwise, fallback, end] = parametersOf([
        ifEquals(variable('aiModel'), 'Cloud', [comment('Cloud')], { otherwise: [comment('ChatGPT')] }),
      ]);
      const group = start?.['GroupingIdentifier'];

      expect(then).toEqual({ WFCommentActionText: 'Cloud' });
      expect(otherwise).toEqual({ GroupingIdentifier: group, WFControlFlowMode: 1 });
      expect(fallback).toEqual({ WFCommentActionText: 'ChatGPT' });
      expect(end).toEqual({ GroupingIdentifier: group, WFControlFlowMode: 2 });
    });
  });

  describe('getDictionaryValue', () => {
    it('should read a key from a template, with the value type the decoded AI Response sets', () => {
      expect(
        parametersOf([
          getDictionaryValue(variable('shortcutData'), text`${variable('shortcutName')}`, { valueType: 'Value' }),
        ]),
      ).toEqual([
        {
          UUID: expect.any(String),
          WFDictionaryKey: {
            Value: {
              attachmentsByRange: { '{0, 1}': { Type: 'Variable', VariableName: 'shortcutName' } },
              string: '\uFFFC',
            },
            WFSerializationType: 'WFTextTokenString',
          },
          WFGetDictionaryValueType: 'Value',
          WFInput: {
            Value: { Type: 'Variable', VariableName: 'shortcutData' },
            WFSerializationType: 'WFTextTokenAttachment',
          },
        },
      ]);
    });

    it('should leave the value type out when none is given, as for the "version" key', () => {
      const [read] = parametersOf([getDictionaryValue(variable('shortcutData'), 'version')]);

      expect(read).not.toHaveProperty('WFGetDictionaryValueType');
      expect(read).toMatchObject({ WFDictionaryKey: 'version' });
    });
  });
});
