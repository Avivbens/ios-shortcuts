import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf, text, variable } from '../references';
import { setVariable } from './scripting';
import { getTextFromInput, replaceText, splitText, textAction, trimWhitespace } from './text';

/** Expected values follow the decoded AI Response shortcut: a plain "5", and the text named "JavaScript". */
describe('text', () => {
  describe('textAction', () => {
    it('should store plain text as a plain string', () => {
      expect(parametersOf([textAction('5')])).toEqual([{ UUID: expect.any(String), WFTextActionText: '5' }]);
    });

    it('should store a template as a token string', () => {
      expect(parametersOf([textAction(text`Hi ${variable('name')}`)])).toEqual([
        {
          UUID: expect.any(String),
          WFTextActionText: {
            Value: {
              attachmentsByRange: { '{3, 1}': { Type: 'Variable', VariableName: 'name' } },
              string: 'Hi \uFFFC',
            },
            WFSerializationType: 'WFTextTokenString',
          },
        },
      ]);
    });

    it('should store a custom name and use it in references, as "JavaScript" is', () => {
      const script = textAction('return 1;', { name: 'JavaScript' });

      const [named, stored] = parametersOf([script, setVariable(variable('code'), outputOf(script))]);

      expect(named).toMatchObject({ CustomOutputName: 'JavaScript' });
      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'JavaScript' } });
    });

    it('should name an unnamed output "Text"', () => {
      const value = textAction('5');

      const [, stored] = parametersOf([value, setVariable(variable('numOfResults'), outputOf(value))]);

      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'Text' } });
    });
  });

  describe('getTextFromInput', () => {
    it('should name its output, as "Better Device Info" is', () => {
      expect(parametersOf([getTextFromInput(variable('page'), { name: 'Better Device Info' })])).toEqual([
        {
          CustomOutputName: 'Better Device Info',
          UUID: expect.any(String),
          WFInput: { Value: { Type: 'Variable', VariableName: 'page' }, WFSerializationType: 'WFTextTokenAttachment' },
        },
      ]);
    });
  });

  describe('replaceText', () => {
    it('should find text in a template and replace it with nothing, as the context cleanup does', () => {
      expect(parametersOf([replaceText(text`${variable('context')}`, { find: 'Message...' })])).toEqual([
        {
          UUID: expect.any(String),
          WFInput: {
            Value: {
              attachmentsByRange: { '{0, 1}': { Type: 'Variable', VariableName: 'context' } },
              string: '\uFFFC',
            },
            WFSerializationType: 'WFTextTokenString',
          },
          WFReplaceTextFind: 'Message...',
        },
      ]);
    });
  });

  describe('splitText', () => {
    it('should split on a custom separator under the lowercase "text" key Shortcuts uses', () => {
      expect(parametersOf([splitText(variable('results'), { separator: '$$$$$' })])).toEqual([
        {
          UUID: expect.any(String),
          WFTextCustomSeparator: '$$$$$',
          WFTextSeparator: 'Custom',
          text: { Value: { Type: 'Variable', VariableName: 'results' }, WFSerializationType: 'WFTextTokenAttachment' },
        },
      ]);
    });
  });

  describe('trimWhitespace', () => {
    it('should trim a template, as the selected response is trimmed', () => {
      expect(parametersOf([trimWhitespace(text`${variable('chosen')}`)])[0]).toMatchObject({
        UUID: expect.any(String),
        WFInput: { WFSerializationType: 'WFTextTokenString' },
      });
    });
  });
});
