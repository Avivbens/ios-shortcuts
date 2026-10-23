import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { isDeepStrictEqual, promisify } from 'node:util';
import { parseShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { isCi } from '@ios-shortcuts/utils';
import { readSignedShortcut } from './signed-shortcut';

const execFileAsync = promisify(execFile);

interface SignOptions {
  inputPath: string;
  displayName: string;
  outputPath: string;
}

/**
 * Signing goes through iCloud, so it needs a Mac signed into it - never CI. The signer names the imported shortcut
 * after the file, hence the copy named after the shortcut. It also restamps `WFWorkflowClientVersion` with the
 * signing Mac's version, the one change the round-trip check allows.
 */
export async function signShortcut({ inputPath, displayName, outputPath }: SignOptions): Promise<string> {
  if (process.platform !== 'darwin') {
    throw new Error('macOS only');
  }

  if (isCi()) {
    throw new Error('Signing needs a Mac signed into iCloud and never runs in CI');
  }

  const workDir = await mkdtemp(join(tmpdir(), 'sign-shortcut-'));
  try {
    const unsignedPath = join(workDir, 'unsigned', `${displayName}.shortcut`);
    const signedPath = join(workDir, 'signed', `${displayName}.shortcut`);
    await mkdir(dirname(unsignedPath));
    await mkdir(dirname(signedPath));
    await copyFile(inputPath, unsignedPath);

    await execFileAsync('shortcuts', ['sign', '--mode', 'anyone', '--input', unsignedPath, '--output', signedPath]);

    const expected = parseShortcutPlist(await readFile(inputPath, 'utf8'));
    const signed = await readSignedShortcut(signedPath);
    if (!isDeepStrictEqual({ ...signed, WFWorkflowClientVersion: expected.WFWorkflowClientVersion }, expected)) {
      throw new Error(`The signed ${displayName} differs from ${inputPath} beyond the client version`);
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(signedPath, outputPath);

    return createHash('sha256')
      .update(await readFile(outputPath))
      .digest('hex');
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
