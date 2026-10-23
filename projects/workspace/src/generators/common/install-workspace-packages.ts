import type { GeneratorCallback, Tree } from '@nx/devkit';
import { installPackagesTask } from '@nx/devkit';

/**
 * A new workspace package only adds its own `package.json`, never the root one, so the install must be forced -
 * otherwise pnpm never links it or records it in `pnpm-lock.yaml`, and CI's frozen install fails.
 */
export function installWorkspacePackages(tree: Tree): GeneratorCallback {
  return () => installPackagesTask(tree, true);
}
