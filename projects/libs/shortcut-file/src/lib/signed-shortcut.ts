import { execFile } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { type ShortcutWorkflow, parseShortcutPlist } from '@ios-shortcuts/shortcut-plist';

const execFileAsync = promisify(execFile);

/** A signed shortcut is an Apple Encrypted Archive: `AEA1`, a profile, a little-endian auth-data size, the auth data. */
const AEA_MAGIC = 'AEA1';
const AUTH_DATA_SIZE_OFFSET = 8;
const AUTH_DATA_OFFSET = 12;

/** `aea` takes the signer's key as an uncompressed P-256 point - the last 65 bytes of the certificate's SPKI. */
const SIGNING_KEY_LENGTH = 65;

export function isSignedShortcut(file: Buffer): boolean {
  return file.subarray(0, AEA_MAGIC.length).toString('latin1') === AEA_MAGIC;
}

function readAuthData(file: Buffer): Buffer {
  const size = file.readUInt32LE(AUTH_DATA_SIZE_OFFSET);

  return file.subarray(AUTH_DATA_OFFSET, AUTH_DATA_OFFSET + size);
}

function toSigningKey(certificate: Buffer): string {
  const spki = new X509Certificate(certificate).publicKey.export({ type: 'spki', format: 'der' });

  return spki.subarray(-SIGNING_KEY_LENGTH).toString('base64');
}

export async function readSignedShortcut(path: string): Promise<ShortcutWorkflow> {
  if (process.platform !== 'darwin') {
    throw new Error('macOS only');
  }

  const file = await readFile(path);
  if (!isSignedShortcut(file)) {
    throw new Error(`${path} is not a signed shortcut`);
  }

  const workDir = await mkdtemp(join(tmpdir(), 'shortcut-file-'));
  try {
    const authDataPath = join(workDir, 'auth.bplist');
    await writeFile(authDataPath, readAuthData(file));
    const { stdout: certificate } = await execFileAsync('plutil', [
      '-extract',
      'SigningCertificateChain.0',
      'raw',
      '-o',
      '-',
      authDataPath,
    ]);

    const archivePath = join(workDir, 'payload.aar');
    /** `aea` rejects a bare base64 key ("Error parsing public key value") - the encoding prefix is required. */
    const signingKey = `base64:${toSigningKey(Buffer.from(certificate.trim(), 'base64'))}`;
    await execFileAsync('aea', ['decrypt', '-i', path, '-o', archivePath, '-sign-pub-value', signingKey]);

    const extractedDir = join(workDir, 'extracted');
    await execFileAsync('aa', ['extract', '-i', archivePath, '-d', extractedDir]);

    const { stdout: xml } = await execFileAsync('plutil', [
      '-convert',
      'xml1',
      '-o',
      '-',
      join(extractedDir, 'Shortcut.wflow'),
    ]);

    return parseShortcutPlist(xml);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
