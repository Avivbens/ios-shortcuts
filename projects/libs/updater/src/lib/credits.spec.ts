import { describe, expect, it } from 'vitest';
import { credits } from './credits';

describe('credits', () => {
  describe('credits', () => {
    it('should point at the author and the repo holding every shortcut', () => {
      expect(credits()).toMatchObject({
        identifier: 'is.workflow.actions.comment',
        parameters: {
          WFCommentActionText: expect.stringContaining('https://github.com/Avivbens/ios-shortcuts'),
        },
      });
    });
  });
});
