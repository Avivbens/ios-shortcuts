import { createShortcut } from '../lib/create-shortcut';
import type { Step } from '../lib/step';
import { ENVELOPE } from './shortcut-envelope.mock';

/** Each action's parameters as they land in the plist, references and UUIDs resolved. */
export function parametersOf(steps: Step[]): Record<string, unknown>[] {
  return createShortcut(ENVELOPE, steps).WFWorkflowActions.map((action) => action.WFWorkflowActionParameters);
}
