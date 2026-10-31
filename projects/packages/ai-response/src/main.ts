import { aiModelSetup } from '@ios-shortcuts/ai-model';
import type { ShortcutContext, ShortcutWorkflow } from '@ios-shortcuts/builder';
import { comment, createShortcut, outputOf, setVariable, textAction } from '@ios-shortcuts/shortcut';
import { credits, updateCheck } from '@ios-shortcuts/updater';
import { chat } from './chat';
import { NUM_OF_RESULTS } from './variables';

export function shortcut({ version }: ShortcutContext): ShortcutWorkflow {
  const numOfResults = textAction('5');
  const aiModel = aiModelSetup();

  return createShortcut(
    {
      WFWorkflowClientVersion: '2607.1.3',
      WFWorkflowMinimumClientVersion: 900,
      WFWorkflowMinimumClientVersionString: '900',
      WFWorkflowIcon: { WFWorkflowIconStartColor: -23508481, WFWorkflowIconGlyphNumber: 61532 },
      WFWorkflowTypes: ['Watch'],
      WFWorkflowInputContentItemClasses: [
        'WFAppContentItem',
        'WFAppStoreAppContentItem',
        'WFArticleContentItem',
        'WFContactContentItem',
        'WFDateContentItem',
        'WFEmailAddressContentItem',
        'WFFolderContentItem',
        'WFGenericFileContentItem',
        'WFImageContentItem',
        'WFiTunesProductContentItem',
        'WFLocationContentItem',
        'WFDCMapsLinkContentItem',
        'WFAVAssetContentItem',
        'WFPDFContentItem',
        'WFPhoneNumberContentItem',
        'WFRichTextContentItem',
        'WFSafariWebPageContentItem',
        'WFStringContentItem',
        'WFURLContentItem',
      ],
      WFWorkflowOutputContentItemClasses: [],
      WFWorkflowImportQuestions: [
        {
          step: numOfResults,
          Category: 'Parameter',
          DefaultValue: '5',
          ParameterKey: 'WFTextActionText',
          Text: 'Amount of results',
        },
        aiModel.importQuestion,
      ],
      WFQuickActionSurfaces: [],
      WFWorkflowHasOutputFallback: false,
      WFWorkflowHasShortcutInputVariables: false,
    },
    [
      credits(),
      comment('—— User Configuration ——\n\nSetup number of results'),
      numOfResults,
      setVariable(NUM_OF_RESULTS, outputOf(numOfResults)),
      ...aiModel.steps,
      comment('—— End of User Configuration ——'),
      ...updateCheck({ name: 'ai-response', version }),
      ...chat(),
    ],
  );
}
