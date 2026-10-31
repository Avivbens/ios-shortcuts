import { beforeEach, describe, expect, it } from 'vitest';
import type { Tree } from '@nx/devkit';
import { addProjectConfiguration, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generateShortcutGenerator from './generate-shortcut.generator';
import type { GenerateShortcutGeneratorSchema } from './generate-shortcut.schema';

describe('generate-shortcut generator', () => {
  let tree: Tree;
  const options: GenerateShortcutGeneratorSchema = { name: 'say-hello', description: 'Say hello from the Share Sheet' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'shortcuts-e2e', {
      root: 'projects/e2e/shortcuts-e2e',
      projectType: 'application',
      implicitDependencies: ['translate-text', 'ai-response'],
    });
  });

  it('should start the TypeScript source with the credits and update check every shortcut shares', async () => {
    await generateShortcutGenerator(tree, options);

    const main = tree.read('projects/packages/say-hello/src/main.ts', 'utf-8');
    expect(main).toContain('credits()');
    expect(main).toContain("...updateCheck({ name: 'say-hello', version })");
  });

  it('should keep its Nx targets in package.json, like the existing shortcuts', async () => {
    await generateShortcutGenerator(tree, options);

    expect(readJson(tree, 'projects/packages/say-hello/package.json')).toMatchObject({
      name: '@ios-shortcuts/say-hello',
      description: 'Say hello from the Share Sheet',
      nx: { name: 'say-hello', projectType: 'application', targets: { build: {}, sign: {}, serve: {}, test: {} } },
    });
  });

  it('should generate a Vitest config built on the shared one, so the shortcut gets a test target', async () => {
    await generateShortcutGenerator(tree, options);

    expect(tree.read('projects/packages/say-hello/vitest.config.mts', 'utf-8')).toContain(
      "from '../../../vitest.shared.mts'",
    );
  });

  it('should name the shortcut after the project, which installs under that name', async () => {
    await generateShortcutGenerator(tree, options);

    expect(tree.read('projects/packages/say-hello/shortcut.config.ts', 'utf-8')).toContain("name: 'Say Hello'");
  });

  it('should add the shortcut to the E2E project, which builds every shortcut it lists', async () => {
    await generateShortcutGenerator(tree, options);

    expect(readProjectConfiguration(tree, 'shortcuts-e2e').implicitDependencies).toEqual([
      'ai-response',
      'say-hello',
      'translate-text',
    ]);
  });
});
