import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { unwrapShortcut } from '@ios-shortcuts/builder';
import { toExecutorContext } from '../common/executor-context.mock';
import unwrapExecutor from './unwrap.executor';

vi.mock('@ios-shortcuts/builder', () => ({ unwrapShortcut: vi.fn() }));

describe('unwrap executor', () => {
  it('should unwrap the given file, relative to the project root, into its source', async () => {
    const projectRoot = join('/repo', 'projects/packages/ai-response');

    expect(
      await unwrapExecutor({ input: 'src/AI Response.shortcut' }, toExecutorContext('/repo', 'ai-response')),
    ).toEqual({
      success: true,
    });

    expect(unwrapShortcut).toHaveBeenCalledWith({
      signedPath: join(projectRoot, 'src/AI Response.shortcut'),
      projectRoot,
    });
  });
});
