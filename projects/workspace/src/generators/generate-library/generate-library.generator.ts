import * as path from 'path';
import type { Tree } from '@nx/devkit';
import { addProjectConfiguration, formatFiles, generateFiles } from '@nx/devkit';
import { installWorkspacePackages } from '../common/install-workspace-packages';
import type { GenerateLibraryGeneratorSchema } from './generate-library.schema';

export async function generateLibraryGenerator(tree: Tree, options: GenerateLibraryGeneratorSchema) {
  const { name } = options;

  const projectRoot = `projects/libs/${name}`;
  addProjectConfiguration(tree, name, {
    sourceRoot: '{projectRoot}/src',
    root: projectRoot,
    projectType: 'library',
    tags: [],
    targets: {
      test: {},
      lint: {},
    },
  });

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  await formatFiles(tree);

  return installWorkspacePackages(tree);
}

export default generateLibraryGenerator;
