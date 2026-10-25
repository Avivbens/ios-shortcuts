import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { SHORTCUT_CONFIG_FILE, readShortcutConfig } from '@ios-shortcuts/builder';
import { createProjectGraphAsync, workspaceRoot } from '@nx/devkit';

export interface ShortcutProject {
  name: string;
  root: string;
  version: string;
  description: string;
  displayName: string;
}

const PackageJsonSchema = z.looseObject({ version: z.string(), description: z.string().min(1) });

async function toShortcutProject(name: string, root: string): Promise<ShortcutProject> {
  const projectRoot = join(workspaceRoot, root);
  const { version, description } = PackageJsonSchema.parse(
    JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8')),
  );
  const { name: displayName } = await readShortcutConfig(projectRoot);

  return { name, root, version, description, displayName };
}

/** A shortcut is an application with a `shortcut.config.ts`, which other applications such as the E2E project lack. */
export async function loadShortcutProjects(): Promise<ShortcutProject[]> {
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const shortcuts = Object.values(graph.nodes)
    .filter(
      ({ data }) =>
        data.projectType === 'application' && existsSync(join(workspaceRoot, data.root, SHORTCUT_CONFIG_FILE)),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  return Promise.all(shortcuts.map(({ name, data }) => toShortcutProject(name, data.root)));
}
