import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ShortcutWorkflow, buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { isCi } from '@ios-shortcuts/utils';
import { signShortcut } from './sign-shortcut';
import { readSignedShortcut } from './signed-shortcut';

const { execFile } = vi.hoisted(() => ({ execFile: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execFile,
}));
vi.mock('./signed-shortcut', () => ({ readSignedShortcut: vi.fn() }));
vi.mock('@ios-shortcuts/utils', () => ({ isCi: vi.fn() }));

const SIGNED_FILE = Buffer.from('AEA1 signed payload');

const WORKFLOW: ShortcutWorkflow = {
  WFWorkflowActions: [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
      WFWorkflowActionParameters: { WFCommentActionText: 'Hello' },
    },
  ],
  WFWorkflowClientVersion: '2607.1.3',
  WFWorkflowMinimumClientVersion: 900,
  WFWorkflowMinimumClientVersionString: '900',
  WFWorkflowIcon: { WFWorkflowIconGlyphNumber: 61532, WFWorkflowIconStartColor: -23508481 },
  WFWorkflowTypes: [],
  WFWorkflowInputContentItemClasses: [],
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowImportQuestions: [],
  WFQuickActionSurfaces: [],
  WFWorkflowHasOutputFallback: false,
  WFWorkflowHasShortcutInputVariables: false,
};

/** Spike A: signing the AI Response source on Shortcuts 4711.1.1 changed only the client version. */
const RESTAMPED_WORKFLOW: ShortcutWorkflow = { ...WORKFLOW, WFWorkflowClientVersion: '4711.1.1' };

describe('sign-shortcut', () => {
  describe('signShortcut', () => {
    const platform = process.platform;
    let dir: string;
    let inputPath: string;
    let outputPath: string;

    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      vi.mocked(isCi).mockReturnValue(false);
      dir = await mkdtemp(join(tmpdir(), 'sign-shortcut-spec-'));
      inputPath = join(dir, 'ai-response.plist');
      outputPath = join(dir, 'dist', 'ai-response_0.2.3.shortcut');
      await writeFile(inputPath, buildShortcutPlist(WORKFLOW));
      execFile.mockImplementation(
        async (_command: string, args: string[], callback: (...result: unknown[]) => void) => {
          await writeFile(args.at(-1) ?? '', SIGNED_FILE);
          callback(null, { stdout: '', stderr: '' });
        },
      );
      vi.mocked(readSignedShortcut).mockResolvedValue(RESTAMPED_WORKFLOW);
    });

    afterEach(async () => {
      Object.defineProperty(process, 'platform', { value: platform });
      await rm(dir, { recursive: true, force: true });
    });

    it('should write the signed file and return its sha256', async () => {
      const sha256 = await signShortcut({ inputPath, displayName: 'AI Response', outputPath });

      expect(await readFile(outputPath)).toEqual(SIGNED_FILE);
      expect(sha256).toBe(createHash('sha256').update(SIGNED_FILE).digest('hex'));
    });

    it('should sign in anyone mode a copy named after the shortcut, the name it imports under', async () => {
      await signShortcut({ inputPath, displayName: 'AI Response', outputPath });

      const [command, args] = execFile.mock.calls[0] ?? [];
      expect(command).toBe('shortcuts');
      expect(args).toEqual(['sign', '--mode', 'anyone', '--input', expect.any(String), '--output', expect.any(String)]);
      expect(basename(args[4])).toBe('AI Response.shortcut');
      expect(dirname(args[4])).not.toBe(dirname(args[6]));
    });

    it('should refuse a signed file that differs from its source beyond the client version', async () => {
      vi.mocked(readSignedShortcut).mockResolvedValue({ ...RESTAMPED_WORKFLOW, WFWorkflowActions: [] });

      await expect(signShortcut({ inputPath, displayName: 'AI Response', outputPath })).rejects.toThrow('differs from');
    });

    it('should refuse to sign in CI, which has no iCloud session', async () => {
      vi.mocked(isCi).mockReturnValue(true);

      await expect(signShortcut({ inputPath, displayName: 'AI Response', outputPath })).rejects.toThrow(
        'never runs in CI',
      );
      expect(execFile).not.toHaveBeenCalled();
    });

    it('should refuse to run off macOS, where the shortcuts CLI does not exist', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      await expect(signShortcut({ inputPath, displayName: 'AI Response', outputPath })).rejects.toThrow('macOS only');
    });
  });
});
