import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachReleaseAsset } from './attach-release-asset';

const { $ } = vi.hoisted(() => ({ $: vi.fn() }));
vi.mock('zurk', () => ({ $ }));
vi.mock('./shortcut-projects', () => ({
  loadShortcutProjects: async () => [
    {
      name: 'ai-response',
      root: 'projects/packages/ai-response',
      version: '0.2.3',
      description: '',
      displayName: 'AI Response',
    },
    {
      name: 'translate-text',
      root: 'projects/packages/translate-text',
      version: '0.2.4',
      description: '',
      displayName: 'Translate Text',
    },
  ],
}));

const TAG = 'release/ai-response/0.2.3';
const TAG_COMMIT = '8172736d1b3f5a0c9e2b4d6f8a0c2e4b6d8f0a1c';

function toCommand([literals, ...values]: [TemplateStringsArray, ...unknown[]]): string {
  return String.raw({ raw: literals }, ...values);
}

/** Answers each git query, and has `sign:ci` write the asset the way the sign executor names it. */
function answer(root: string, { head = TAG_COMMIT, changes = '' } = {}): void {
  $.mockImplementation(async (...call: [TemplateStringsArray, ...unknown[]]) => {
    const command = toCommand(call);
    const stdout =
      command === 'git status --porcelain' ? changes : command === 'git rev-parse HEAD' ? head : TAG_COMMIT;
    if (command.includes('ai-response:sign:ci')) {
      await mkdir(join(root, 'dist/ai-response'), { recursive: true });
      await writeFile(join(root, 'dist/ai-response/AI.Response.shortcut'), 'AEA1');
    }

    return { toString: () => stdout };
  });
}

function toCalls(): string[] {
  return $.mock.calls.map((call: [TemplateStringsArray, ...unknown[]]) => toCommand(call));
}

describe('attach-release-asset', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'attach-release-asset-spec-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  describe('attachReleaseAsset', () => {
    it('should sign the tagged version, attach it to its release, then dispatch the README sync', async () => {
      answer(root);

      expect(await attachReleaseAsset(root, TAG)).toBe(join(root, 'dist/ai-response/AI.Response.shortcut'));
      expect(toCalls().slice(3)).toEqual([
        'pnpm exec nx run ai-response:sign:ci -- --version 0.2.3',
        `gh release upload ${TAG} ${join(root, 'dist/ai-response/AI.Response.shortcut')}`,
        'gh workflow run sync-readme.yaml',
      ]);
    });

    it('should refuse when HEAD is not the tag, since the asset must be the released source', async () => {
      answer(root, { head: '57d08a0e4f6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d' });

      await expect(attachReleaseAsset(root, TAG)).rejects.toThrow(`HEAD is not ${TAG}`);
      expect(toCalls()).not.toContain('gh workflow run sync-readme.yaml');
    });

    it('should refuse a working tree with changes, which the release does not hold', async () => {
      answer(root, { changes: ' M projects/packages/ai-response/src/main.ts' });

      await expect(attachReleaseAsset(root, TAG)).rejects.toThrow('working tree has changes');
    });

    it('should stop before uploading when signing wrote no asset', async () => {
      answer(root);

      await expect(attachReleaseAsset(root, 'release/translate-text/0.2.4')).rejects.toThrow('did not write');
      expect(toCalls().some((call) => call.startsWith('gh release upload'))).toBe(false);
    });
  });
});
