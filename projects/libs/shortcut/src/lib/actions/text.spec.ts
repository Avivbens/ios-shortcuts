import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf, text, variable } from '../references';
import { setVariable } from './scripting';
import { textAction } from './text';

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

      const [named, stored] = parametersOf([script, setVariable('code', outputOf(script))]);

      expect(named).toMatchObject({ CustomOutputName: 'JavaScript' });
      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'JavaScript' } });
    });

    it('should name an unnamed output "Text"', () => {
      const value = textAction('5');

      const [, stored] = parametersOf([value, setVariable('numOfResults', outputOf(value))]);

      expect(stored?.['WFInput']).toMatchObject({ Value: { OutputName: 'Text' } });
    });
  });
});
