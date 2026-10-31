import { type Action, type TextTemplate, rawAction } from '../step';

/** Shortcuts' raw `WFLLMModel` values, as decoded from exported shortcuts. */
const MODELS = { onDevice: 'Apple Intelligence on Device', cloud: 'Apple Intelligence' } as const;

export type AppleIntelligenceModel = keyof typeof MODELS;

interface UseModelOptions {
  prompt: string | TextTemplate;
  model?: AppleIntelligenceModel;
  outputType?: 'Automatic' | 'Text' | 'List' | 'Dictionary';
  followUp?: boolean;
}

export function useModel({ prompt, model, outputType, followUp }: UseModelOptions): Action {
  return rawAction(
    'is.workflow.actions.askllm',
    {
      WFLLMPrompt: prompt,
      ...(model === undefined ? {} : { WFLLMModel: MODELS[model] }),
      ...(outputType === undefined ? {} : { WFGenerativeResultType: outputType }),
      ...(followUp === undefined ? {} : { FollowUp: followUp }),
    },
    { outputName: 'Response' },
  );
}
