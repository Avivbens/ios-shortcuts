import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readShortcutConfig } from './shortcut-config';

describe('shortcut-config', () => {
  describe('readShortcutConfig', () => {
    let projectRoot: string;

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'shortcut-config-spec-'));
    });

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true });
    });

    it('should read the default export of the project shortcut.config.ts', async () => {
      await writeFile(join(projectRoot, 'shortcut.config.ts'), `export default { name: 'AI Response' };\n`);

      expect(await readShortcutConfig(projectRoot)).toEqual({ name: 'AI Response' });
    });

    it('should refuse a config without a display name', async () => {
      await writeFile(join(projectRoot, 'shortcut.config.ts'), `export default { name: '' };\n`);

      await expect(readShortcutConfig(projectRoot)).rejects.toThrow();
    });
  });
});
