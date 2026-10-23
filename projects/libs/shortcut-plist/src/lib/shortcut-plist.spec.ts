import { describe, expect, it } from 'vitest';
import { buildShortcutPlist, parseShortcutPlist } from './shortcut-plist';
import type { ShortcutWorkflow } from './shortcut-workflow.schema';

/** Trimmed from the unwrapped AI Response shortcut: its envelope and the two actions that set `shortcutVersion`. */
const WORKFLOW: ShortcutWorkflow = {
  WFWorkflowActions: [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.gettext',
      WFWorkflowActionParameters: { UUID: '0D35A098-309E-43C6-BB4F-BF0229569065', WFTextActionText: '0.2.2' },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
      WFWorkflowActionParameters: {
        WFInput: {
          Value: { OutputName: 'Text', OutputUUID: '0D35A098-309E-43C6-BB4F-BF0229569065', Type: 'ActionOutput' },
          WFSerializationType: 'WFTextTokenAttachment',
        },
        WFVariableName: 'shortcutVersion',
      },
    },
  ],
  WFWorkflowClientVersion: '2607.1.3',
  WFWorkflowMinimumClientVersion: 900,
  WFWorkflowMinimumClientVersionString: '900',
  WFWorkflowIcon: { WFWorkflowIconGlyphNumber: 61532, WFWorkflowIconStartColor: -23508481 },
  WFWorkflowTypes: ['Watch'],
  WFWorkflowInputContentItemClasses: ['WFAppContentItem', 'WFAppStoreAppContentItem', 'WFArticleContentItem'],
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowImportQuestions: [
    {
      ActionIndex: 4,
      Category: 'Parameter',
      DefaultValue: '5',
      ParameterKey: 'WFTextActionText',
      Text: 'Amount of results ',
    },
  ],
  WFQuickActionSurfaces: [],
  WFWorkflowHasOutputFallback: false,
  WFWorkflowHasShortcutInputVariables: false,
};

describe('shortcut-plist', () => {
  describe('buildShortcutPlist', () => {
    it('should round-trip a workflow deep-equal through parseShortcutPlist', () => {
      const xml = buildShortcutPlist(WORKFLOW);

      expect(parseShortcutPlist(xml)).toEqual(WORKFLOW);
    });

    it('should write the negative icon color as an integer, as Shortcuts stores it', () => {
      const xml = buildShortcutPlist(WORKFLOW);

      expect(xml).toContain('<integer>-23508481</integer>');
    });
  });

  describe('parseShortcutPlist', () => {
    it('should keep keys the schema does not model, so a round trip loses nothing', () => {
      const xml = buildShortcutPlist({ ...WORKFLOW, WFWorkflowTriggers: [] });

      expect(parseShortcutPlist(xml)).toHaveProperty('WFWorkflowTriggers', []);
    });

    it('should reject an envelope without actions', () => {
      const xml = buildShortcutPlist(WORKFLOW).replace('<key>WFWorkflowActions</key>', '<key>Actions</key>');

      expect(() => parseShortcutPlist(xml)).toThrow('WFWorkflowActions');
    });
  });
});
