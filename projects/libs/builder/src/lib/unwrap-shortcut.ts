import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readSignedShortcut } from '@ios-shortcuts/shortcut-file';
import { buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';

interface UnwrapOptions {
  signedPath: string;
  outputPath: string;
}

/** A porting aid: the decoded plist is reference for writing a shortcut's TypeScript source, never a source itself. */
export async function unwrapShortcut({ signedPath, outputPath }: UnwrapOptions): Promise<void> {
  const workflow = await readSignedShortcut(signedPath);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buildShortcutPlist(workflow));
}
