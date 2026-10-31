import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  SHORTCUTS_MANIFEST_FILE,
  type ShortcutsManifest,
  ShortcutsManifestSchema,
  VERSION_VARIABLE,
  compileShortcut,
  getVariableText,
  parseShortcutPlist,
} from '@ios-shortcuts/builder';
import { DependencyType, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { createNxTaskEnvSchema } from './schemas/nx-task-env.schema';

const graph = readCachedProjectGraph();

const { NX_TASK_TARGET_PROJECT: E2E_PROJECT } = createNxTaskEnvSchema(graph).parse(env);

/** The shortcuts under test are this project's `implicitDependencies`, so `nx affected` re-runs it when one changes. */
const shortcuts = (graph.dependencies[E2E_PROJECT] ?? [])
  .filter(({ type }) => type === DependencyType.implicit)
  .map(({ target }) => target)
  .sort();

const PackageJsonSchema = z.looseObject({ version: z.string() });

function projectRootOf(name: string): string {
  const root = graph.nodes[name]?.data.root;
  if (root === undefined) {
    throw new Error(`${name} is not a project in the Nx graph`);
  }

  return join(workspaceRoot, root);
}

function versionOf(name: string): string {
  return PackageJsonSchema.parse(JSON.parse(readFileSync(join(projectRootOf(name), 'package.json'), 'utf8'))).version;
}

function readManifest(): ShortcutsManifest {
  return ShortcutsManifestSchema.parse(JSON.parse(readFileSync(join(workspaceRoot, SHORTCUTS_MANIFEST_FILE), 'utf8')));
}

describe('shortcuts', () => {
  let outputDir: string;

  beforeAll(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'shortcuts-e2e-'));
  });

  afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  it('should list nothing in shortcuts.json but real shortcuts', () => {
    expect(shortcuts).toEqual(expect.arrayContaining(Object.keys(readManifest())));
  });

  describe.each(shortcuts)('%s', (name) => {
    async function build(): Promise<ReturnType<typeof parseShortcutPlist>> {
      const outputPath = join(outputDir, `${name}.plist`);
      await compileShortcut({ projectRoot: projectRootOf(name), name, version: versionOf(name), outputPath });

      return parseShortcutPlist(await readFile(outputPath, 'utf8'));
    }

    /** A shortcut enters shortcuts.json with its first signed release, so a new one is not listed yet. */
    const listed = readManifest()[name]?.version;

    it.skipIf(listed === undefined)(
      'should list a version in shortcuts.json no newer than package.json, as it moves only once a release is attached',
      () => {
        expect((listed ?? '').localeCompare(versionOf(name), undefined, { numeric: true })).toBeLessThanOrEqual(0);
      },
    );

    it('should build from its TypeScript source, carrying its package.json version', async () => {
      const workflow = await build();

      expect([undefined, versionOf(name)]).toContain(getVariableText(workflow, VERSION_VARIABLE));
    });

    it('should ask each import question on an action holding its parameter, or the answer is lost', async () => {
      const { WFWorkflowActions: actions, WFWorkflowImportQuestions: questions } = await build();

      questions.forEach(({ ActionIndex, ParameterKey }) => {
        expect(actions[ActionIndex]?.WFWorkflowActionParameters).toHaveProperty(ParameterKey);
      });
    });
  });
});
