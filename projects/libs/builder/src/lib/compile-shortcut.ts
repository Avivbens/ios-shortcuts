import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { coerce } from 'semver';
import { buildShortcutPlist, parseShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { NAME_VARIABLE, SHORTCUT_SOURCE_FILE, VERSION_VARIABLE } from './shortcut-source.constants';
import { getVariableText, setVariableText } from './shortcut-variables';

interface CompileOptions {
  projectRoot: string;
  name: string;
  version: string;
  outputPath: string;
}

/**
 * Rewrites the source as well as the output, as fast-alfred rewrites `info.plist`: the committed source is the record
 * of the version a release shipped.
 */
export async function compileShortcut({ projectRoot, name, version, outputPath }: CompileOptions): Promise<void> {
  const coerced = coerce(version)?.version;
  if (!coerced) {
    throw new Error(`${version} is not a version`);
  }

  const sourcePath = join(projectRoot, SHORTCUT_SOURCE_FILE);
  const workflow = setVariableText(parseShortcutPlist(await readFile(sourcePath, 'utf8')), VERSION_VARIABLE, coerced);

  const shortcutName = getVariableText(workflow, NAME_VARIABLE);
  if (shortcutName !== undefined && shortcutName !== name) {
    throw new Error(`${NAME_VARIABLE} is "${shortcutName}", expected the project name "${name}"`);
  }

  const xml = buildShortcutPlist(workflow);
  await writeFile(sourcePath, xml);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml);
}
