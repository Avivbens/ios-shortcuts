import { z } from 'zod';

/** The root `shortcuts.json` installed copies fetch to offer updates - its shape must never change. */
export const ShortcutsManifestSchema = z.record(z.string(), z.object({ version: z.string(), download: z.url() }));

export type ShortcutsManifest = z.infer<typeof ShortcutsManifestSchema>;
