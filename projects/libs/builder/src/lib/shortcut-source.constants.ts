/** The committed, unsigned source of a shortcut, at its project root. */
export const SHORTCUT_SOURCE_FILE = 'shortcut.plist';

/** A shortcut's TypeScript source; it exports the `shortcut` function builds call. */
export const SHORTCUT_ENTRY_FILE = 'src/main.ts';

/** Installed copies compare this text with the repo's `shortcuts.json` to offer updates, so it must be the build's version. */
export const VERSION_VARIABLE = 'shortcutVersion';

/** The `shortcuts.json` key an installed copy looks itself up by - it must stay the project name. */
export const NAME_VARIABLE = 'shortcutName';

/** Per-shortcut settings that are not part of the workflow, such as its display name. */
export const SHORTCUT_CONFIG_FILE = 'shortcut.config.ts';
