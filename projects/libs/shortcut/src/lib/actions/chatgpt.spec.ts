import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { text, variable } from '../references';
import { askChatGpt } from './chatgpt';

const ASK_CHATGPT_INTENT = {
  AppIntentIdentifier: 'AskIntent',
  BundleIdentifier: 'com.openai.chat',
  Name: 'ChatGPT',
  TeamIdentifier: '2DC432GLL2',
};

describe('chatgpt', () => {
  describe('askChatGpt', () => {
    it('should match the decoded Translate Text call, which sends only a prompt', () => {
      expect(parametersOf([askChatGpt({ prompt: text`${variable('Prompt')}` })])).toEqual([
        {
          AppIntentDescriptor: ASK_CHATGPT_INTENT,
          ShowWhenRun: false,
          UUID: expect.any(String),
          prompt: {
            Value: { attachmentsByRange: { '{0, 1}': { Type: 'Variable', VariableName: 'Prompt' } }, string: '\uFFFC' },
            WFSerializationType: 'WFTextTokenString',
          },
        },
      ]);
    });

    it('should store the model and chat options as the decoded AI Response call does', () => {
      const [call] = parametersOf([
        askChatGpt({
          prompt: 'Hi',
          model: { identifier: 'gpt-4o', name: 'GPT-4o' },
          continuous: false,
          newChat: false,
        }),
      ]);

      expect(call).toMatchObject({
        continuous: false,
        model: { identifier: 'gpt-4o', subtitle: { key: 'GPT-4o' }, title: { key: 'GPT-4o' } },
        newChat: false,
      });
    });
  });
});
