import { describe, expect, it } from 'vitest';
import { getVariableText, setVariableText } from './shortcut-variables';
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
  });

  describe('setVariableText', () => {
    it('should replace only the text that feeds the variable', () => {
      const workflow = setVariableText(VERSIONED_WORKFLOW, 'shortcutVersion', '0.2.3');

      expect(getVariableText(workflow, 'shortcutVersion')).toBe('0.2.3');
      expect(getVariableText(workflow, 'shortcutName')).toBe('ai-response');
    });

    it('should leave a workflow without the variable untouched', () => {
      const workflow = toWorkflow([toTextAction('A', 'text')]);

      expect(setVariableText(workflow, 'shortcutVersion', '0.2.3')).toBe(workflow);
    });

    it('should refuse a variable set from anything but a plain Text action, since it could not be stamped', () => {
      const workflow = toWorkflow([toSetVariableAction('shortcutVersion', 'MISSING')]);

      expect(() => setVariableText(workflow, 'shortcutVersion', '0.2.3')).toThrow(
        'shortcutVersion is not set from a plain Text action',
      );
    });
  });
});
