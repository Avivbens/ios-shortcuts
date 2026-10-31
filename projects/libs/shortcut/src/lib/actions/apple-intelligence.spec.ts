import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { text, variable } from '../references';
import { useModel } from './apple-intelligence';

describe('apple-intelligence', () => {
  describe('useModel', () => {
    it.each([
      ['cloud', 'Apple Intelligence'],
      ['onDevice', 'Apple Intelligence on Device'],
    ] as const)('should store the %s model as the decoded Use Model export does', (model, raw) => {
      const [call] = parametersOf([useModel({ prompt: 'Hi', model })]);

      expect(call).toMatchObject({ WFLLMModel: raw });
    });

    it("should store every option in the shape of Apple's Morning Report gallery call", () => {
      expect(
        parametersOf([
          useModel({
            prompt: text`Summarize my day: ${variable('Report')}`,
            model: 'cloud',
            outputType: 'Automatic',
            followUp: true,
          }),
        ]),
      ).toEqual([
        {
          FollowUp: true,
          UUID: expect.any(String),
          WFGenerativeResultType: 'Automatic',
          WFLLMModel: 'Apple Intelligence',
          WFLLMPrompt: {
            Value: {
              attachmentsByRange: { '{18, 1}': { Type: 'Variable', VariableName: 'Report' } },
              string: 'Summarize my day: ￼',
            },
            WFSerializationType: 'WFTextTokenString',
          },
        },
      ]);
    });

    it('should send only the prompt when no option is set, leaving the model to the Shortcuts default', () => {
      expect(parametersOf([useModel({ prompt: 'Hi' })])).toEqual([{ UUID: expect.any(String), WFLLMPrompt: 'Hi' }]);
    });

    it('should name its output "Response", as Shortcuts does', () => {
      expect(useModel({ prompt: 'Hi' }).outputName).toBe('Response');
    });
  });
});
