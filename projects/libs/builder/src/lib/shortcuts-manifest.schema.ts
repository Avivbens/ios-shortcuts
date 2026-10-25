import { z } from 'zod';

export const SHORTCUTS_MANIFEST_FILE = 'shortcuts.json';

/** The root `shortcuts.json` installed copies fetch to offer updates - its shape must never change. */
export const ShortcutsManifestSchema = z.record(z.string(), z.object({ version: z.string(), download: z.url() }));

export type ShortcutsManifest = z.infer<typeof ShortcutsManifestSchema>;
