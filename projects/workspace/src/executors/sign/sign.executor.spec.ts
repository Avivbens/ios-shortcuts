import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readShortcutConfig, signShortcut } from '@ios-shortcuts/builder';
import { toExecutorContext } from '../common/executor-context.mock';
import signExecutor from './sign.executor';

vi.mock('@ios-shortcuts/builder', () => ({ readShortcutConfig: vi.fn(), signShortcut: vi.fn() }));

describe('sign executor', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'sign-executor-spec-'));
    const projectRoot = join(root, 'projects/packages/ai-response');
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({ name: '@ios-shortcuts/ai-response', version: '0.2.2' }),
    );
    vi.mocked(readShortcutConfig).mockResolvedValue({ name: 'AI Response' });
    vi.mocked(signShortcut).mockResolvedValue('0'.repeat(64));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('should sign the build into an asset named after the display name, which Shortcuts installs it under', async () => {
    expect(await signExecutor({}, toExecutorContext(root, 'ai-response'))).toEqual({ success: true });

    expect(signShortcut).toHaveBeenCalledWith({
      inputPath: join(root, 'dist/ai-response/ai-response.plist'),
      displayName: 'AI Response',
      outputPath: join(root, 'dist/ai-response/AI.Response.shortcut'),
    });
  });

  it('should keep the version out of the asset name, so an update replaces the installed copy', async () => {
    await signExecutor({ version: '0.2.3' }, toExecutorContext(root, 'ai-response'));

    expect(signShortcut).toHaveBeenCalledWith(
      expect.objectContaining({ outputPath: join(root, 'dist/ai-response/AI.Response.shortcut') }),
    );
  });
});
