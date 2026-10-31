import { describe, expect, it } from 'vitest';
import { type Block, type Step, text, variable } from '@ios-shortcuts/shortcut';
import { AI_MODEL, aiModelSetup, askAiModel } from './ai-model';

const PROMPT = variable('prompt');
const RESULTS = variable('results');

/** Each branch's steps, ending with the one that stores its answer, in the order Shortcuts checks them. */
function answersOf(block: Block): Step[][] {
  return block.sections.flatMap(({ steps }) => {
    const [first] = steps;

    return steps.length === 1 && first?.kind === 'block' ? answersOf(first) : [steps];
  });
}

describe('ai-model', () => {
  describe('aiModelSetup', () => {
    it('should ask on import, defaulting to Cloud so a new install needs no ChatGPT app', () => {
      const {
        steps: [, choice],
        importQuestion,
      } = aiModelSetup();

      expect(choice).toMatchObject({ parameters: { WFTextActionText: 'Cloud' } });
      expect(importQuestion).toEqual({
        step: choice,
        Category: 'Parameter',
        DefaultValue: 'Cloud',
        ParameterKey: 'WFTextActionText',
        Text: 'AI model - Cloud, On-Device or ChatGPT',
      });
    });

    it('should store the answer in the variable `askAiModel` compares', () => {
      const [, choice, store] = aiModelSetup().steps;

      expect(store).toMatchObject({
        parameters: { WFInput: { kind: 'output', step: choice }, WFVariableName: AI_MODEL.name },
      });
    });
  });

  describe('askAiModel', () => {
    it('should try Cloud, then On-Device, then ChatGPT for any other answer', () => {
      const sol = { identifier: 'gpt-6.1-sol', name: 'GPT-6.1 Sol' };

      expect(askAiModel(PROMPT, RESULTS, { chatGpt: { model: sol, newChat: false } })).toMatchObject({
        start: { WFConditionalActionString: 'Cloud', WFInput: { Variable: AI_MODEL } },
        sections: [
          {
            steps: [
              {
                identifier: 'is.workflow.actions.askllm',
                parameters: {
                  WFGenerativeResultType: 'Text',
                  WFLLMModel: 'Apple Intelligence',
                  WFLLMPrompt: text`${PROMPT}`,
                },
              },
              {},
            ],
          },
          {
            marker: {},
            steps: [
              {
                start: { WFConditionalActionString: 'On-Device', WFInput: { Variable: AI_MODEL } },
                sections: [
                  {
                    steps: [
                      {
                        identifier: 'is.workflow.actions.askllm',
                        parameters: {
                          WFGenerativeResultType: 'Text',
                          WFLLMModel: 'Apple Intelligence on Device',
                          WFLLMPrompt: text`${PROMPT}`,
                        },
                      },
                      {},
                    ],
                  },
                  {
                    marker: {},
                    steps: [
                      {
                        identifier: 'com.openai.chat.AskIntent',
                        parameters: { model: { identifier: 'gpt-6.1-sol' }, newChat: false, prompt: text`${PROMPT}` },
                      },
                      {},
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it.each([false, true])('should store every answer in the target, from the step before it (list: %s)', (list) => {
      const branches = answersOf(askAiModel(PROMPT, RESULTS, { list }));

      expect(branches).toHaveLength(3);
      branches.forEach((steps) => {
        expect(steps.at(-1)).toMatchObject({
          parameters: { WFInput: { kind: 'output', step: steps.at(-2) }, WFVariableName: 'results' },
        });
      });
    });

    it("should ask Apple Intelligence for a list, and split the ChatGPT app's text on the marker its prompt asks for", () => {
      const [cloud, onDevice, chatGpt] = answersOf(askAiModel(PROMPT, RESULTS, { list: true }));

      expect([cloud?.[0], onDevice?.[0]]).toMatchObject([
        { parameters: { WFGenerativeResultType: 'List' } },
        { parameters: { WFGenerativeResultType: 'List' } },
      ]);
      expect(chatGpt).toMatchObject([
        {
          identifier: 'com.openai.chat.AskIntent',
          parameters: {
            prompt: text`${PROMPT}

Remember: output strictly the items, in plain text, each separated by $$$$$.`,
          },
        },
        { identifier: 'is.workflow.actions.text.split', parameters: { WFTextCustomSeparator: '$$$$$' } },
        {},
      ]);
    });
  });
});
