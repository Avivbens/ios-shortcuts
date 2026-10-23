import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readSignedShortcut } from '@ios-shortcuts/shortcut-file';
import { buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { SHORTCUT_SOURCE_FILE } from './shortcut-source.constants';

interface UnwrapOptions {
  signedPath: string;
  projectRoot: string;
}

/** Writes through `buildShortcutPlist`, the same serializer `compileShortcut` uses, so the first build is idempotent. */
export async function unwrapShortcut({ signedPath, projectRoot }: UnwrapOptions): Promise<void> {
  const workflow = await readSignedShortcut(signedPath);

  await writeFile(join(projectRoot, SHORTCUT_SOURCE_FILE), buildShortcutPlist(workflow));
}
