import { type Action, type TextTemplate, rawAction } from '../step';

/** The ChatGPT app's App Intent, as the app registers it. */
const ASK_CHATGPT_INTENT = {
  AppIntentIdentifier: 'AskIntent',
  BundleIdentifier: 'com.openai.chat',
  Name: 'ChatGPT',
  TeamIdentifier: '2DC432GLL2',
};

interface AskChatGptOptions {
  prompt: string | TextTemplate;
  model?: { identifier: string; name: string };
  continuous?: boolean;
  newChat?: boolean;
  showWhenRun?: boolean;
}

export function askChatGpt({ prompt, model, continuous, newChat, showWhenRun = false }: AskChatGptOptions): Action {
  return rawAction(
    'com.openai.chat.AskIntent',
    {
      AppIntentDescriptor: ASK_CHATGPT_INTENT,
      ShowWhenRun: showWhenRun,
      prompt,
      ...(continuous === undefined ? {} : { continuous }),
      ...(model === undefined
        ? {}
        : { model: { identifier: model.identifier, subtitle: { key: model.name }, title: { key: model.name } } }),
      ...(newChat === undefined ? {} : { newChat }),
    },
    { outputName: 'Ask ChatGPT' },
  );
}
