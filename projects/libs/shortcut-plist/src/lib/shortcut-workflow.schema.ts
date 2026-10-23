import { z } from 'zod';

/**
 * Every dictionary is loose: Shortcuts adds keys between releases, and a codec that strips what it does not model
 * would silently drop them from a signed file.
 */
export const ShortcutActionSchema = z.looseObject({
  WFWorkflowActionIdentifier: z.string(),
  WFWorkflowActionParameters: z.record(z.string(), z.unknown()),
});

export type ShortcutAction = z.infer<typeof ShortcutActionSchema>;

export const ShortcutIconSchema = z.looseObject({
  WFWorkflowIconStartColor: z.int(),
  WFWorkflowIconGlyphNumber: z.int(),
});

export const ShortcutImportQuestionSchema = z.looseObject({
  ActionIndex: z.int(),
  Category: z.string(),
  DefaultValue: z.string(),
  ParameterKey: z.string(),
  Text: z.string(),
});

export const ShortcutWorkflowSchema = z.looseObject({
  WFWorkflowActions: z.array(ShortcutActionSchema),
  WFWorkflowClientVersion: z.string(),
  WFWorkflowMinimumClientVersion: z.int(),
  WFWorkflowMinimumClientVersionString: z.string(),
  WFWorkflowIcon: ShortcutIconSchema,
  WFWorkflowTypes: z.array(z.string()),
  WFWorkflowInputContentItemClasses: z.array(z.string()),
  WFWorkflowOutputContentItemClasses: z.array(z.string()),
  WFWorkflowImportQuestions: z.array(ShortcutImportQuestionSchema),
  WFQuickActionSurfaces: z.array(z.string()),
  WFWorkflowHasOutputFallback: z.boolean(),
  WFWorkflowHasShortcutInputVariables: z.boolean(),
  WFWorkflowNoInputBehavior: z
    .looseObject({
      Name: z.string(),
      Parameters: z.record(z.string(), z.unknown()),
    })
    .optional(),
});

export type ShortcutWorkflow = z.infer<typeof ShortcutWorkflowSchema>;
