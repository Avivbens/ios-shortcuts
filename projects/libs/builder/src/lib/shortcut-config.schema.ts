import { z } from 'zod';

export const ShortcutConfigSchema = z.object({
  /** The display name - Shortcuts imports a signed file under its file name, so signing names the file after it. */
  name: z.string().min(1),
});

export type ShortcutConfig = z.infer<typeof ShortcutConfigSchema>;
