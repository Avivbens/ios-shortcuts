import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type ShortcutWorkflow, parseShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { compileShortcut } from './compile-shortcut';
import { getVariableText } from './shortcut-variables';
import { VERSIONED_WORKFLOW, toTextAction, toWorkflow } from './workflow.mock';

describe('compile-shortcut', () => {
  describe('compileShortcut', () => {
    let projectRoot: string;
    let outputPath: string;

    /** A `src/main.ts` that returns `workflow`, with the build's version in its first action when `stamp` is set. */
    async function writeSource(workflow: ShortcutWorkflow, { stamp }: { stamp: boolean }): Promise<void> {
      const stampLine = stamp
        ? 'workflow.WFWorkflowActions[0].WFWorkflowActionParameters.WFTextActionText = version;'
        : '';
      await mkdir(join(projectRoot, 'src'), { recursive: true });
      await writeFile(
        join(projectRoot, 'src/main.ts'),
        `export function shortcut({ version }: { version: string }) {\n  const workflow = ${JSON.stringify(workflow)};\n  ${stampLine}\n  return workflow;\n}\n`,
      );
    }

    async function readOutput(): Promise<ShortcutWorkflow> {
      return parseShortcutPlist(await readFile(outputPath, 'utf8'));
    }

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'compile-shortcut-spec-'));
      outputPath = join(projectRoot, 'dist', 'ai-response', 'ai-response.plist');
    });

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true });
    });

    it('should build the source with the version and write only the output', async () => {
      await writeSource(VERSIONED_WORKFLOW, { stamp: true });

      await compileShortcut({ projectRoot, name: 'ai-response', version: '0.2.3', outputPath });

      expect(getVariableText(await readOutput(), 'shortcutVersion')).toBe('0.2.3');
      expect(await readdir(projectRoot)).toEqual(['dist', 'src']);
    });

    it('should hand the source a coerced version, as fast-alfred coerces a quoted one', async () => {
      await writeSource(VERSIONED_WORKFLOW, { stamp: true });

      await compileShortcut({ projectRoot, name: 'ai-response', version: '"0.2.3"', outputPath });

      expect(getVariableText(await readOutput(), 'shortcutVersion')).toBe('0.2.3');
    });

    it('should build a shortcut that carries no version as it is', async () => {
      const workflow = toWorkflow([toTextAction('A', 'Translate')]);
      await writeSource(workflow, { stamp: false });

      await compileShortcut({ projectRoot, name: 'translate-text', version: '0.2.3', outputPath });

      expect(await readOutput()).toEqual(workflow);
    });

    it('should load a source split into modules imported without extensions, as the shortcut library is', async () => {
      const workflow = toWorkflow([toTextAction('A', 'Translate')]);
      await mkdir(join(projectRoot, 'src'), { recursive: true });
      await writeFile(join(projectRoot, 'src/workflow.ts'), `export const workflow = ${JSON.stringify(workflow)};\n`);
      await writeFile(
        join(projectRoot, 'src/main.ts'),
        "import { workflow } from './workflow';\n\nexport function shortcut() {\n  return workflow;\n}\n",
      );

      await compileShortcut({ projectRoot, name: 'translate-text', version: '0.2.3', outputPath });

      expect(await readOutput()).toEqual(workflow);
    });

    it('should refuse a source that ignores the version, which would leave installed copies prompting forever', async () => {
      await writeSource(VERSIONED_WORKFLOW, { stamp: false });

      await expect(compileShortcut({ projectRoot, name: 'ai-response', version: '0.2.3', outputPath })).rejects.toThrow(
        'shortcutVersion is "0.2.2", expected the build version "0.2.3"',
      );
    });

    it('should refuse a shortcutName other than the project name, the key installed copies look up', async () => {
      await writeSource(VERSIONED_WORKFLOW, { stamp: true });

      await expect(
        compileShortcut({ projectRoot, name: 'translate-text', version: '0.2.3', outputPath }),
      ).rejects.toThrow('shortcutName is "ai-response", expected the project name "translate-text"');
    });

    it('should refuse a source without a `shortcut` function', async () => {
      await mkdir(join(projectRoot, 'src'), { recursive: true });
      await writeFile(join(projectRoot, 'src/main.ts'), 'export const shortcut = 1;\n');

      await expect(compileShortcut({ projectRoot, name: 'ai-response', version: '0.2.3', outputPath })).rejects.toThrow(
        'src/main.ts must export a `shortcut` function',
      );
    });

    it('should refuse a version it cannot coerce', async () => {
      await expect(compileShortcut({ projectRoot, name: 'ai-response', version: 'next', outputPath })).rejects.toThrow(
        'next is not a version',
      );
    });
  });
});
