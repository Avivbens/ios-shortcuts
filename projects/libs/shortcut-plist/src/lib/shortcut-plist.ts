import { type PlistObject, build, parse } from 'plist';
import { type ShortcutWorkflow, ShortcutWorkflowSchema } from './shortcut-workflow.schema';

export function parseShortcutPlist(xml: string): ShortcutWorkflow {
  return ShortcutWorkflowSchema.parse(parse(xml));
}

export function buildShortcutPlist(workflow: ShortcutWorkflow): string {
  /** The schema types parameter values as `unknown`; they came from `parse`, so they are plist values already. */
  return build(workflow as PlistObject);
}
