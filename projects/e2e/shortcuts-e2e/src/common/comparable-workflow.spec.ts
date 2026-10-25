import { describe, expect, it } from 'vitest';
import type { ShortcutWorkflow } from '@ios-shortcuts/builder';
import { toComparableWorkflow } from './comparable-workflow';

/** A trimmed decoded Translate Text: a list, a choice that reads it, and a clipboard copy with an unused UUID. */
function toWorkflow(listUuid: string, chooseUuid: string, clipboardUuid: string): ShortcutWorkflow {
  return {
    WFWorkflowActions: [
      {
        WFWorkflowActionIdentifier: 'is.workflow.actions.list',
        WFWorkflowActionParameters: { UUID: listUuid, WFItems: ['Hebrew'] },
      },
      {
        WFWorkflowActionIdentifier: 'is.workflow.actions.choosefromlist',
        WFWorkflowActionParameters: {
          UUID: chooseUuid,
          WFInput: { Value: { OutputName: 'List', OutputUUID: listUuid, Type: 'ActionOutput' } },
        },
      },
      {
        WFWorkflowActionIdentifier: 'is.workflow.actions.setclipboard',
        WFWorkflowActionParameters: { UUID: clipboardUuid, WFInput: { Value: { Type: 'Variable' } } },
      },
    ],
    WFWorkflowClientVersion: '3218.0.4.100',
    WFWorkflowMinimumClientVersion: 1113,
    WFWorkflowMinimumClientVersionString: '1113',
    WFWorkflowIcon: { WFWorkflowIconStartColor: 946986751, WFWorkflowIconGlyphNumber: 61440 },
    WFWorkflowTypes: [],
    WFWorkflowInputContentItemClasses: [],
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowImportQuestions: [],
    WFQuickActionSurfaces: [],
    WFWorkflowHasOutputFallback: false,
    WFWorkflowHasShortcutInputVariables: true,
  };
}

const SIGNED = toWorkflow(
  'BE8F9D55-3F82-4A98-8E02-2D016CAB16C9',
  'A09509FF-416B-482F-AC3E-ACC41E3E1DF2',
  '365ECDD1-43A6-4CFB-AE2D-629BEDA5CBAA',
);

describe('comparable-workflow', () => {
  describe('toComparableWorkflow', () => {
    it('should match the same wiring under different UUIDs', () => {
      const built = toWorkflow(
        '11111111-1111-5111-8111-111111111111',
        '22222222-2222-5222-8222-222222222222',
        '33333333-3333-5333-8333-333333333333',
      );

      expect(toComparableWorkflow(built)).toEqual(toComparableWorkflow(SIGNED));
    });

    it('should drop the UUIDs nothing references, such as the clipboard copy', () => {
      expect(toComparableWorkflow(SIGNED)).toMatchObject({
        WFWorkflowActions: [
          { WFWorkflowActionParameters: { UUID: 'uuid-1' } },
          { WFWorkflowActionParameters: { WFInput: { Value: { OutputUUID: 'uuid-1' } } } },
          { WFWorkflowActionParameters: { WFInput: { Value: { Type: 'Variable' } } } },
        ],
      });
    });

    it('should tell apart a reference to a different action', () => {
      const rewired = toWorkflow(
        'BE8F9D55-3F82-4A98-8E02-2D016CAB16C9',
        'A09509FF-416B-482F-AC3E-ACC41E3E1DF2',
        '365ECDD1-43A6-4CFB-AE2D-629BEDA5CBAA',
      );
      rewired.WFWorkflowActions[1] = {
        WFWorkflowActionIdentifier: 'is.workflow.actions.choosefromlist',
        WFWorkflowActionParameters: {
          WFInput: {
            Value: { OutputName: 'List', OutputUUID: '365ECDD1-43A6-4CFB-AE2D-629BEDA5CBAA', Type: 'ActionOutput' },
          },
        },
      };

      expect(toComparableWorkflow(rewired)).not.toEqual(toComparableWorkflow(SIGNED));
    });

    it('should ignore trailing spaces, which the signed releases carry in some titles', () => {
      const spaced = toWorkflow(
        'BE8F9D55-3F82-4A98-8E02-2D016CAB16C9',
        'A09509FF-416B-482F-AC3E-ACC41E3E1DF2',
        '365ECDD1-43A6-4CFB-AE2D-629BEDA5CBAA',
      );
      spaced.WFWorkflowActions[0] = {
        WFWorkflowActionIdentifier: 'is.workflow.actions.list',
        WFWorkflowActionParameters: { UUID: 'BE8F9D55-3F82-4A98-8E02-2D016CAB16C9', WFItems: ['Hebrew '] },
      };

      expect(toComparableWorkflow(spaced)).toEqual(toComparableWorkflow(SIGNED));
    });
  });
});
