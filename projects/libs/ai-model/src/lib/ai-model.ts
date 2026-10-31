import {
  type Action,
  type AppleIntelligenceModel,
  type Block,
  type Reference,
  type ShortcutImportQuestion,
  type Step,
  type VariableReference,
  askChatGpt,
  combineText,
  comment,
  ifEquals,
  outputOf,
  setVariable,
  splitText,
  text,
  textAction,
  useModel,
  variable,
} from '@ios-shortcuts/shortcut';

export const AI_MODEL: VariableReference = variable('aiModel');

const CHOICES = { chatGpt: 'ChatGPT', cloud: 'Cloud', onDevice: 'On-Device' } as const;

const LIST_SEPARATOR = '$$$$$';

const CHOICES_LABEL = `${CHOICES.cloud}, ${CHOICES.onDevice} or ${CHOICES.chatGpt}`;

interface AiModelSetup {
  steps: Step[];
  importQuestion: ShortcutImportQuestion;
}

type ChatGptOptions = Omit<Parameters<typeof askChatGpt>[0], 'prompt'>;

/** Cloud is the default, so a new install runs on Apple Intelligence with no app or account to set up. */
export function aiModelSetup(): AiModelSetup {
  const choice = textAction(CHOICES.cloud);

  return {
    steps: [comment(`Setup AI model - ${CHOICES_LABEL}`), choice, setVariable(AI_MODEL, outputOf(choice))],
    importQuestion: {
      step: choice,
      Category: 'Parameter',
      DefaultValue: CHOICES.cloud,
      ParameterKey: 'WFTextActionText',
      Text: `AI model - ${CHOICES_LABEL}`,
    },
  };
}

/**
 * The import answer is free text, so anything but Cloud or On-Device runs ChatGPT. With `list`, Apple Intelligence
 * returns the list itself, rejoined and split into plain text since Choose from List cuts its own items to one line,
 * while the ChatGPT app answers only in text, split on a marker its prompt asks for.
 */
export function askAiModel(
  prompt: Reference,
  target: VariableReference,
  { list = false, chatGpt = {} }: { list?: boolean; chatGpt?: ChatGptOptions } = {},
): Block {
  const store = (steps: Action[], answer: Action): Step[] => [...steps, setVariable(target, outputOf(answer))];

  function appleIntelligence(model: AppleIntelligenceModel): Step[] {
    if (!list) {
      const response = useModel({ prompt: text`${prompt}`, model, outputType: 'Text' });

      return store([response], response);
    }

    const response = useModel({ prompt: text`${prompt}`, model, outputType: 'List' });
    const combined = combineText(outputOf(response), { separator: LIST_SEPARATOR });
    const items = splitText(outputOf(combined), { separator: LIST_SEPARATOR });

    return store([response, combined, items], items);
  }

  function chatGptApp(): Step[] {
    if (!list) {
      const response = askChatGpt({ prompt: text`${prompt}`, ...chatGpt });

      return store([response], response);
    }

    const response = askChatGpt({
      prompt: text`${prompt}

Remember: output strictly the items, in plain text, each separated by ${LIST_SEPARATOR}.`,
      ...chatGpt,
    });
    const items = splitText(outputOf(response), { separator: LIST_SEPARATOR });

    return store([response, items], items);
  }

  return ifEquals(AI_MODEL, CHOICES.cloud, appleIntelligence('cloud'), {
    otherwise: [ifEquals(AI_MODEL, CHOICES.onDevice, appleIntelligence('onDevice'), { otherwise: chatGptApp() })],
  });
}
