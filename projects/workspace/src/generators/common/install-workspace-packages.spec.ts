import { describe, expect, it, vi } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { installWorkspacePackages } from './install-workspace-packages';

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execFileSync,
}));

describe('install-workspace-packages', () => {
  describe('installWorkspacePackages', () => {
    it('should wait for the generator to write its files before installing', () => {
      installWorkspacePackages(createTreeWithEmptyWorkspace());

      expect(execFileSync).not.toHaveBeenCalled();
    });

    it('should force a resolution, so a package with no dependencies still lands in the lockfile', () => {
      const tree = createTreeWithEmptyWorkspace();

      installWorkspacePackages(tree)();

      expect(execFileSync).toHaveBeenCalledWith('pnpm', ['install', '--no-prefer-frozen-lockfile'], {
        cwd: tree.root,
        stdio: 'inherit',
      });
    });
  });
});
