import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSignedShortcut } from '@ios-shortcuts/shortcut-file';
import { buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { unwrapShortcut } from './unwrap-shortcut';
import { VERSIONED_WORKFLOW } from './workflow.mock';

vi.mock('@ios-shortcuts/shortcut-file', () => ({ readSignedShortcut: vi.fn() }));

describe('unwrap-shortcut', () => {
  describe('unwrapShortcut', () => {
    let projectRoot: string;
    let outputPath: string;

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'unwrap-shortcut-spec-'));
      outputPath = join(projectRoot, 'dist', 'ai-response', 'ai-response.unwrapped.plist');
      vi.mocked(readSignedShortcut).mockResolvedValue(VERSIONED_WORKFLOW);
    });

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true });
    });

    it('should decode the signed file into the output, through the serializer builds use', async () => {
      await unwrapShortcut({ signedPath: 'AI Response.shortcut', outputPath });

      expect(readSignedShortcut).toHaveBeenCalledWith('AI Response.shortcut');
      expect(await readFile(outputPath, 'utf8')).toBe(buildShortcutPlist(VERSIONED_WORKFLOW));
    });
  });
});
