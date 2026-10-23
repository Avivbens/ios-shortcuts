import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

const PackageJsonSchema = z.looseObject({ version: z.string() });

/** `ci` runs get the release's version as `--version`; local runs fall back to the project's `package.json`. */
export async function getVersion(projectRoot: string, version?: string): Promise<string> {
  if (version) {
    return version;
  }

  return PackageJsonSchema.parse(JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'))).version;
}
