import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { text, variable } from '../references';
import { alert } from './notification';

describe('notification', () => {
  describe('alert', () => {
    it('should match the decoded Translate Text alert', () => {
      expect(
        parametersOf([
          alert({ title: text`Translated to ${variable('TranslateTo')}`, message: text`${variable('Results')}` }),
        ]),
      ).toEqual([
        {
          WFAlertActionMessage: {
            Value: {
              attachmentsByRange: { '{0, 1}': { Type: 'Variable', VariableName: 'Results' } },
              string: '\uFFFC',
            },
            WFSerializationType: 'WFTextTokenString',
          },
          WFAlertActionTitle: {
            Value: {
              attachmentsByRange: { '{14, 1}': { Type: 'Variable', VariableName: 'TranslateTo' } },
              string: 'Translated to \uFFFC',
            },
            WFSerializationType: 'WFTextTokenString',
          },
        },
      ]);
    });
  });
});
