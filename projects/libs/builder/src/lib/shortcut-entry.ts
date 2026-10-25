import { createRequire } from 'node:module';
import { join } from 'node:path';
import { z } from 'zod';
import type { ShortcutWorkflow } from '@ios-shortcuts/shortcut-plist';
import { SHORTCUT_ENTRY_FILE } from './shortcut-source.constants';

/** `@swc-node/register` exports its hook to `require` only, so it is required rather than imported. */
const { register } = createRequire(__filename)(
  '@swc-node/register/register',
) as typeof import('@swc-node/register/register');

/** What a build hands a shortcut's source: the version the release cut, coerced. */
export interface ShortcutContext {
  version: string;
}

export type ShortcutEntry = (context: ShortcutContext) => ShortcutWorkflow | Promise<ShortcutWorkflow>;

const ShortcutModuleSchema = z.looseObject({
  shortcut: z.custom<ShortcutEntry>((value) => typeof value === 'function'),
});

/**
 * Node's own loaders need file extensions, which the libraries' imports leave out. So the source is required with
 * the swc hook Nx itself loads TypeScript through, registered only for this call.
 */
export function loadShortcutEntry(projectRoot: string): ShortcutEntry {
  const unregister = register();
  try {
    const module: unknown = createRequire(join(projectRoot, 'package.json'))(join(projectRoot, SHORTCUT_ENTRY_FILE));
    const parsed = ShortcutModuleSchema.safeParse(module);
    if (!parsed.success) {
      throw new Error(`${SHORTCUT_ENTRY_FILE} must export a \`shortcut\` function`);
    }

    return parsed.data.shortcut;
  } finally {
    unregister();
  }
}
