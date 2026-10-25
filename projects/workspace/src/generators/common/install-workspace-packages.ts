import { execSync } from 'node:child_process';
import { type GeneratorCallback, type Tree, detectPackageManager, getPackageManagerCommand } from '@nx/devkit';

/**
 * Nx's install command skips resolution while the lockfile satisfies every manifest, and a new package with no
 * dependencies always does - so it never lands in `pnpm-lock.yaml`. That command ignores `preferFrozenLockfile: false`
 * in config, so `installPackagesTask` cannot be used and the flag goes on the command itself.
 */
export function installWorkspacePackages(tree: Tree): GeneratorCallback {
  return () => {
    const { install } = getPackageManagerCommand(detectPackageManager(tree.root), tree.root);
    execSync(`${install} --no-prefer-frozen-lockfile`, { cwd: tree.root, stdio: 'inherit' });
  };
}
