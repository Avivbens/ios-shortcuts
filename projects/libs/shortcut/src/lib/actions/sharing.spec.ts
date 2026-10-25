import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { variable } from '../references';
import { setClipboard } from './sharing';

describe('sharing', () => {
  describe('setClipboard', () => {
    it('should copy a variable, as the decoded Translate Text copies its results', () => {
      expect(parametersOf([setClipboard(variable('Results'))])).toEqual([
        {
          WFInput: {
            Value: { Type: 'Variable', VariableName: 'Results' },
            WFSerializationType: 'WFTextTokenAttachment',
          },
        },
      ]);
    });
  });
});
