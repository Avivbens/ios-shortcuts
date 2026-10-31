import * as path from 'path';
import type { Tree } from '@nx/devkit';
import { formatFiles, generateFiles, readProjectConfiguration, updateProjectConfiguration } from '@nx/devkit';
import { installWorkspacePackages } from '../common/install-workspace-packages';
import type { GenerateShortcutGeneratorSchema } from './generate-shortcut.schema';

/** The E2E project builds every shortcut it lists as an implicit dependency, so a new shortcut joins that list. */
const E2E_PROJECT = 'shortcuts-e2e';

export async function generateShortcutGenerator(tree: Tree, options: GenerateShortcutGeneratorSchema) {
  const { name } = options;

  const projectRoot = `projects/packages/${name}`;
  const nameTitleCase = name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, { ...options, nameTitleCase });

  const e2e = readProjectConfiguration(tree, E2E_PROJECT);
  updateProjectConfiguration(tree, E2E_PROJECT, {
    ...e2e,
    implicitDependencies: [...new Set([...(e2e.implicitDependencies ?? []), name])].sort(),
  });
  await formatFiles(tree);

  return installWorkspacePackages(tree);
}

export default generateShortcutGenerator;
