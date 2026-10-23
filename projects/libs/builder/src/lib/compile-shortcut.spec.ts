import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type ShortcutWorkflow, buildShortcutPlist, parseShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { compileShortcut } from './compile-shortcut';
import { getVariableText } from './shortcut-variables';
import { VERSIONED_WORKFLOW, toTextAction, toWorkflow } from './workflow.mock';

describe('compile-shortcut', () => {
  describe('compileShortcut', () => {
    let projectRoot: string;
    let outputPath: string;

    async function compile(workflow: ShortcutWorkflow, version: string, name = 'ai-response'): Promise<void> {
      await writeFile(join(projectRoot, 'shortcut.plist'), buildShortcutPlist(workflow));
      await compileShortcut({ projectRoot, name, version, outputPath });
    }

    async function readWorkflow(path: string): Promise<ShortcutWorkflow> {
      return parseShortcutPlist(await readFile(path, 'utf8'));
    }

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'compile-shortcut-spec-'));
      outputPath = join(projectRoot, 'dist', 'ai-response', 'ai-response.plist');
    });

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true });
    });

    it('should stamp the version into both the source and the output', async () => {
      await compile(VERSIONED_WORKFLOW, '0.2.3');

      expect(getVariableText(await readWorkflow(join(projectRoot, 'shortcut.plist')), 'shortcutVersion')).toBe('0.2.3');
      expect(getVariableText(await readWorkflow(outputPath), 'shortcutVersion')).toBe('0.2.3');
    });

    it('should coerce a quoted version, as fast-alfred does', async () => {
      await compile(VERSIONED_WORKFLOW, '"0.2.3"');

      expect(getVariableText(await readWorkflow(outputPath), 'shortcutVersion')).toBe('0.2.3');
    });

    it('should only validate a shortcut that carries no version', async () => {
      const workflow = toWorkflow([toTextAction('A', 'Translate')]);

      await compile(workflow, '0.2.3');

      expect(await readWorkflow(outputPath)).toEqual(workflow);
    });

    it('should refuse a shortcutName other than the project name, the key installed copies look up', async () => {
      await expect(compile(VERSIONED_WORKFLOW, '0.2.3', 'translate-text')).rejects.toThrow(
        'shortcutName is "ai-response", expected the project name "translate-text"',
      );
    });

    it('should refuse a version it cannot coerce', async () => {
      await expect(compile(VERSIONED_WORKFLOW, 'next')).rejects.toThrow('next is not a version');
    });
  });
});
