import { execFileSync } from 'node:child_process';
import type { GeneratorCallback, Tree } from '@nx/devkit';

/**
 * pnpm skips resolution while the lockfile satisfies every manifest, and a new package with no dependencies always
 * does - so a plain install never records it in `pnpm-lock.yaml`. Turning off `prefer-frozen-lockfile` forces the
 * resolution that adds its entry, and nothing else.
 */
export function installWorkspacePackages(tree: Tree): GeneratorCallback {
  return () => {
    execFileSync('pnpm', ['install', '--no-prefer-frozen-lockfile'], { cwd: tree.root, stdio: 'inherit' });
  };
}
