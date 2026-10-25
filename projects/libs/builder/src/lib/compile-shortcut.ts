import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { coerce } from 'semver';
import { ShortcutWorkflowSchema, buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { loadShortcutEntry } from './shortcut-entry';
import { NAME_VARIABLE, VERSION_VARIABLE } from './shortcut-source.constants';
import { getVariableText } from './shortcut-variables';

interface CompileOptions {
  projectRoot: string;
  name: string;
  version: string;
  outputPath: string;
}

/** The plist is build output only: the source is `src/main.ts`, which receives the version as it builds. */
export async function compileShortcut({ projectRoot, name, version, outputPath }: CompileOptions): Promise<void> {
  const coerced = coerce(version)?.version;
  if (!coerced) {
    throw new Error(`${version} is not a version`);
  }

  const shortcut = loadShortcutEntry(projectRoot);
  const workflow = ShortcutWorkflowSchema.parse(await shortcut({ version: coerced }));

  const builtVersion = getVariableText(workflow, VERSION_VARIABLE);
  if (builtVersion !== undefined && builtVersion !== coerced) {
    throw new Error(`${VERSION_VARIABLE} is "${builtVersion}", expected the build version "${coerced}"`);
  }

  const shortcutName = getVariableText(workflow, NAME_VARIABLE);
  if (shortcutName !== undefined && shortcutName !== name) {
    throw new Error(`${NAME_VARIABLE} is "${shortcutName}", expected the project name "${name}"`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buildShortcutPlist(workflow));
}
