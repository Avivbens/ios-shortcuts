import { join } from 'node:path';
import { type ShortcutConfig, ShortcutConfigSchema } from './shortcut-config.schema';
import { SHORTCUT_CONFIG_FILE } from './shortcut-source.constants';

export async function readShortcutConfig(projectRoot: string): Promise<ShortcutConfig> {
  const { default: config } = await import(join(projectRoot, SHORTCUT_CONFIG_FILE));

  return ShortcutConfigSchema.parse(config);
}
