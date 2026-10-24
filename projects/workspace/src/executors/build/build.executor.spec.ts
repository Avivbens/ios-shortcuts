import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compileShortcut } from '@ios-shortcuts/builder';
import { toExecutorContext } from '../common/executor-context.mock';
import buildExecutor from './build.executor';

vi.mock('@ios-shortcuts/builder', () => ({ compileShortcut: vi.fn() }));

describe('build executor', () => {
  let root: string;
  let projectRoot: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'build-executor-spec-'));
    projectRoot = join(root, 'projects/packages/ai-response');
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      join(projectRoot, 'package.json'),
      JSON.stringify({ name: '@ios-shortcuts/ai-response', version: '0.2.2' }),
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('should compile with the package.json version when none is passed', async () => {
    expect(await buildExecutor({}, toExecutorContext(root, 'ai-response'))).toEqual({ success: true });

    expect(compileShortcut).toHaveBeenCalledWith({
      projectRoot,
      name: 'ai-response',
      version: '0.2.2',
      outputPath: join(root, 'dist/ai-response/ai-response.plist'),
    });
  });

  it('should compile with the version build:ci gets from the release', async () => {
    await buildExecutor({ version: '0.2.3' }, toExecutorContext(root, 'ai-response'));

    expect(compileShortcut).toHaveBeenCalledWith(expect.objectContaining({ version: '0.2.3' }));
  });

  it('should refuse to run outside a project target', async () => {
    await expect(buildExecutor({}, toExecutorContext(root))).rejects.toThrow('must run as a project target');
  });
});
