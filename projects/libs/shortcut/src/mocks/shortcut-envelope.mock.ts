import type { ShortcutEnvelope } from '../lib/create-shortcut';

/** The envelope of the decoded Translate Text shortcut, with its input content classes trimmed to one. */
export const ENVELOPE: ShortcutEnvelope = {
  WFWorkflowClientVersion: '3218.0.4.100',
  WFWorkflowMinimumClientVersion: 1113,
  WFWorkflowMinimumClientVersionString: '1113',
  WFWorkflowIcon: { WFWorkflowIconStartColor: 946986751, WFWorkflowIconGlyphNumber: 61440 },
  WFWorkflowTypes: ['ActionExtension', 'WFWorkflowTypeShowInSearch'],
  WFWorkflowInputContentItemClasses: ['WFStringContentItem'],
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowImportQuestions: [],
  WFQuickActionSurfaces: [],
  WFWorkflowHasOutputFallback: false,
  WFWorkflowHasShortcutInputVariables: true,
  WFWorkflowNoInputBehavior: { Name: 'WFWorkflowNoInputBehaviorGetClipboard', Parameters: {} },
};
