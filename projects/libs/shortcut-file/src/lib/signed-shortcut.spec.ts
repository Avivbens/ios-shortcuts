import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ShortcutWorkflow, buildShortcutPlist } from '@ios-shortcuts/shortcut-plist';
import { isSignedShortcut, readSignedShortcut } from './signed-shortcut';

const { execFile } = vi.hoisted(() => ({ execFile: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execFile,
}));

/** The leaf certificate from the AI Response shortcut's auth data, as `plutil -extract ... raw` prints it. */
const LEAF_CERTIFICATE = [
  'MIIDBjCCAqygAwIBAgIIQr+mnFuFuGgwCgYIKoZIzj0EAwIwcjEmMCQGA1UEAwwdQXBwbGUgU3lzdGVtIEludGVncmF0aW9uIENB',
  'IDQxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJV',
  'UzAeFw0yNDEyMjYxODU4MTNaFw0yNjAxMjEyMDE1MDJaME0xKTAnBgNVBAMMIDc4YTQ2NjI4NDkxZDRjNmM5OWZiYzJkZjBjZGQw',
  'YjNlMRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGwDztJPY5RdEByW',
  'LBrP+QEJNXrEptS89vmNVHtLD9H7AcfuCEEDhRZFmp0Z8g4MCv7Lsilm3uotssNdEPnoZ/SjggFPMIIBSzAMBgNVHRMBAf8EAjAA',
  'MB8GA1UdIwQYMBaAFHpHujiKFSRIIkbNvo8aJHs0AyppMEEGCCsGAQUFBwEBBDUwMzAxBggrBgEFBQcwAYYlaHR0cDovL29jc3Au',
  'YXBwbGUuY29tL29jc3AwMy1hc2ljYTQwNDCBlgYDVR0gBIGOMIGLMIGIBgkqhkiG92NkBQEwezB5BggrBgEFBQcCAjBtDGtUaGlz',
  'IGNlcnRpZmljYXRlIGlzIHRvIGJlIHVzZWQgZXhjbHVzaXZlbHkgZm9yIGZ1bmN0aW9ucyBpbnRlcm5hbCB0byBBcHBsZSBQcm9k',
  'dWN0cyBhbmQvb3IgQXBwbGUgcHJvY2Vzc2VzLjAdBgNVHQ4EFgQUlAHsSDP9H8DMbFs60mu7Z1VVYZgwDgYDVR0PAQH/BAQDAgeA',
  'MA8GCSqGSIb3Y2QSAQQCBQAwCgYIKoZIzj0EAwIDSAAwRQIhAMGBoz2GhPsbazn7LbOo+w0IFkpIkZTJj8xXhRVf5OthAiBtnOLg',
  'T6wFJEq1sLsg0gYJbg6Zaon3gvaXrzTk2uVqpA==',
].join('');

/** Its public key as the uncompressed point `aea` takes - the value that decrypted the real file. */
const SIGNING_KEY = 'BGwDztJPY5RdEByWLBrP+QEJNXrEptS89vmNVHtLD9H7AcfuCEEDhRZFmp0Z8g4MCv7Lsilm3uotssNdEPnoZ/Q=';

const AUTH_DATA = Buffer.from('bplist00 auth data');

const WORKFLOW: ShortcutWorkflow = {
  WFWorkflowActions: [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
      WFWorkflowActionParameters: { WFCommentActionText: 'Hello' },
    },
  ],
  WFWorkflowClientVersion: '2607.1.3',
  WFWorkflowMinimumClientVersion: 900,
  WFWorkflowMinimumClientVersionString: '900',
  WFWorkflowIcon: { WFWorkflowIconGlyphNumber: 61532, WFWorkflowIconStartColor: -23508481 },
  WFWorkflowTypes: [],
  WFWorkflowInputContentItemClasses: [],
  WFWorkflowOutputContentItemClasses: [],
  WFWorkflowImportQuestions: [],
  WFQuickActionSurfaces: [],
  WFWorkflowHasOutputFallback: false,
  WFWorkflowHasShortcutInputVariables: false,
};

function toSignedFile(authData: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(authData.length);

  return Buffer.concat([Buffer.from('AEA1'), Buffer.alloc(4), size, authData, Buffer.from('payload')]);
}

function respondTo(command: string, args: string[]): string {
  if (command === 'plutil' && args[0] === '-extract') {
    return `${LEAF_CERTIFICATE}\n`;
  }

  if (command === 'plutil' && args[0] === '-convert') {
    return buildShortcutPlist(WORKFLOW);
  }

  return '';
}

describe('signed-shortcut', () => {
  describe('isSignedShortcut', () => {
    it('should recognise the AEA1 magic of a signed export', () => {
      expect(isSignedShortcut(toSignedFile(AUTH_DATA))).toBe(true);
    });

    it('should reject an unsigned plist', () => {
      expect(isSignedShortcut(Buffer.from(buildShortcutPlist(WORKFLOW)))).toBe(false);
    });
  });

  describe('readSignedShortcut', () => {
    const platform = process.platform;
    let dir: string;
    let path: string;

    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      dir = await mkdtemp(join(tmpdir(), 'signed-shortcut-spec-'));
      path = join(dir, 'AI Response.shortcut');
      await writeFile(path, toSignedFile(AUTH_DATA));
      execFile.mockImplementation((command: string, args: string[], callback: (...result: unknown[]) => void) => {
        callback(null, { stdout: respondTo(command, args), stderr: '' });
      });
    });

    afterEach(async () => {
      Object.defineProperty(process, 'platform', { value: platform });
      await rm(dir, { recursive: true, force: true });
    });

    it('should parse the extracted Shortcut.wflow into a workflow', async () => {
      expect(await readSignedShortcut(path)).toEqual(WORKFLOW);
    });

    it('should decrypt with the leaf certificate key, prefixed as aea requires', async () => {
      await readSignedShortcut(path);

      expect(execFile).toHaveBeenCalledWith(
        'aea',
        ['decrypt', '-i', path, '-o', expect.any(String), '-sign-pub-value', `base64:${SIGNING_KEY}`],
        expect.any(Function),
      );
    });

    it('should hand plutil exactly the auth data from the header', async () => {
      const seen: Buffer[] = [];
      execFile.mockImplementation(async (command: string, args: string[], callback: (...result: unknown[]) => void) => {
        if (command === 'plutil' && args[0] === '-extract') {
          seen.push(await readFile(args.at(-1) ?? ''));
        }

        callback(null, { stdout: respondTo(command, args), stderr: '' });
      });

      await readSignedShortcut(path);

      expect(seen).toEqual([AUTH_DATA]);
    });

    it('should refuse a file without the AEA1 magic', async () => {
      await writeFile(path, buildShortcutPlist(WORKFLOW));

      await expect(readSignedShortcut(path)).rejects.toThrow('is not a signed shortcut');
    });

    it('should refuse to run off macOS, where aea and aa do not exist', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      await expect(readSignedShortcut(path)).rejects.toThrow('macOS only');
    });
  });
});
