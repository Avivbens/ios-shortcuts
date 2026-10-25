import { describe, expect, it } from 'vitest';
import { createUuidSequence } from './uuid';

describe('uuid', () => {
  describe('createUuidSequence', () => {
    it('should yield uppercase name-based UUIDs, as Shortcuts writes them', () => {
      expect(createUuidSequence()()).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/);
    });

    it('should repeat the same sequence for the same seed, and never repeat within one', () => {
      const first = createUuidSequence();
      const second = createUuidSequence();
      const uuids = [first(), first(), first()];

      expect([second(), second(), second()]).toEqual(uuids);
      expect(new Set(uuids).size).toBe(3);
    });
  });
});
