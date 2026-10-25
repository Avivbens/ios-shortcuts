import { describe, expect, it, vi } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { installWorkspacePackages } from './install-workspace-packages';

const { execSync } = vi.hoisted(() => ({ execSync: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execSync,
}));
vi.mock('@nx/devkit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nx/devkit')>()),
  getPackageManagerCommand: () => ({ install: 'pnpm install --no-frozen-lockfile' }),
}));

describe('install-workspace-packages', () => {
  describe('installWorkspacePackages', () => {
    it('should wait for the generator to write its files before installing', () => {
      installWorkspacePackages(createTreeWithEmptyWorkspace());

      expect(execSync).not.toHaveBeenCalled();
    });

    it("should force a resolution on Nx's install command, so a package with no dependencies lands in the lockfile", () => {
      const tree = createTreeWithEmptyWorkspace();

      installWorkspacePackages(tree)();

      expect(execSync).toHaveBeenCalledWith('pnpm install --no-frozen-lockfile --no-prefer-frozen-lockfile', {
        cwd: tree.root,
        stdio: 'inherit',
      });
    });
  });
});
