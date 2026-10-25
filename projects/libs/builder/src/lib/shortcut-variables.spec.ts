import { describe, expect, it } from 'vitest';
import { getVariableText } from './shortcut-variables';
import { VERSIONED_WORKFLOW, toSetVariableAction, toTextAction, toWorkflow } from './workflow.mock';

describe('shortcut-variables', () => {
  describe('getVariableText', () => {
    it('should read the text that feeds a variable through its OutputUUID', () => {
      expect(getVariableText(VERSIONED_WORKFLOW, 'shortcutVersion')).toBe('0.2.2');
      expect(getVariableText(VERSIONED_WORKFLOW, 'shortcutName')).toBe('ai-response');
    });

    it('should return undefined when no action sets the variable', () => {
      expect(getVariableText(toWorkflow([toTextAction('A', 'text')]), 'shortcutVersion')).toBeUndefined();
    });

    it('should refuse a variable set from anything but a plain Text action, since it could not be checked', () => {
      const workflow = toWorkflow([toSetVariableAction('shortcutVersion', 'MISSING')]);

      expect(() => getVariableText(workflow, 'shortcutVersion')).toThrow(
        'shortcutVersion is not set from a plain Text action',
      );
    });
  });
});
