import { describe, expect, it } from 'vitest';
import { outputOf, text, variable } from './references';
import { rawAction } from './step';

describe('references', () => {
  describe('outputOf', () => {
    it('should refuse an action without an output, which nothing can reference', () => {
      expect(() => outputOf(rawAction('is.workflow.actions.comment', {}))).toThrow(
        'is.workflow.actions.comment has no output to reference',
      );
    });
  });

  describe('text', () => {
    it('should inline plain values and keep references as separate segments', () => {
      const name = variable('TranslateTo');

      expect(text`Translated to ${name} in ${'v1'}`.segments).toEqual(['Translated to ', name, ' in v1']);
    });
  });
});
