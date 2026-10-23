import type { ShortcutAction, ShortcutWorkflow } from '@ios-shortcuts/shortcut-plist';

/** Shapes trimmed from the unwrapped AI Response shortcut: a Text action and the `setvariable` that stores it. */
export function toTextAction(uuid: string, text: string): ShortcutAction {
  return {
    WFWorkflowActionIdentifier: 'is.workflow.actions.gettext',
    WFWorkflowActionParameters: { UUID: uuid, WFTextActionText: text },
  };
}

export function toSetVariableAction(name: string, outputUuid: string): ShortcutAction {
  return {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFInput: {
        Value: { OutputName: 'Text', OutputUUID: outputUuid, Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      WFVariableName: name,
    },
  };
}

export function toWorkflow(actions: ShortcutAction[]): ShortcutWorkflow {
  return {
    WFWorkflowActions: actions,
    WFWorkflowClientVersion: '2607.1.3',
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowMinimumClientVersionString: '900',
    WFWorkflowIcon: { WFWorkflowIconGlyphNumber: 61532, WFWorkflowIconStartColor: -23508481 },
    WFWorkflowTypes: [],
    WFWorkflowInputContentItemClasses: [],
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowImportQuestions: [],
    WFQuickActionSurfaces: [],
    WFWorkflowHasOutputFallback: false,
    WFWorkflowHasShortcutInputVariables: false,
  };
}

/** AI Response's update-check head: the stamped version, then the name it looks itself up by. */
export const VERSIONED_WORKFLOW = toWorkflow([
  toTextAction('0D35A098-309E-43C6-BB4F-BF0229569065', '0.2.2'),
  toSetVariableAction('shortcutVersion', '0D35A098-309E-43C6-BB4F-BF0229569065'),
  toTextAction('EDA96ABA-1D68-4095-A1C1-4E8269AC599E', 'ai-response'),
  toSetVariableAction('shortcutName', 'EDA96ABA-1D68-4095-A1C1-4E8269AC599E'),
]);
