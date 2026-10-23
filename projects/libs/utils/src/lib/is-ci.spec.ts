import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCi } from './is-ci';

describe('is-ci', () => {
  describe('isCi', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should detect GitHub Actions, which sets CI to true', () => {
      vi.stubEnv('CI', 'true');

      expect(isCi()).toBe(true);
    });

    it('should not treat a shell without CI as a CI run', () => {
      vi.stubEnv('CI', undefined);

      expect(isCi()).toBe(false);
    });

    it('should honour CI=false, the usual opt-out', () => {
      vi.stubEnv('CI', 'false');

      expect(isCi()).toBe(false);
    });
  });
});
