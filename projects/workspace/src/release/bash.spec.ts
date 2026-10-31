import { describe, expect, it } from 'vitest';
import { bash } from './bash';

/** Runs real commands, so the Ubuntu checks, where `/bin/sh` is dash, catch a regression the Mac never shows. */
describe('bash', () => {
  describe('bash', () => {
    it('should pass an argument zurk quotes on as written, where dash would add a literal `$`', async () => {
      expect(String(await bash()`printf %s ${'release/*'}`)).toBe('release/*');
    });

    it('should feed the input to the command, as the release comment is posted', async () => {
      expect(String(await bash({ input: 'Released' })`cat`)).toBe('Released');
    });
  });
});
