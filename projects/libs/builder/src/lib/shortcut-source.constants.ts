/** The committed, unsigned source of a shortcut, at its project root. */
export const SHORTCUT_SOURCE_FILE = 'shortcut.plist';

/** Installed copies compare this text with the repo's `shortcuts.json` to offer updates, so every build stamps it. */
export const VERSION_VARIABLE = 'shortcutVersion';

/** The `shortcuts.json` key an installed copy looks itself up by - it must stay the project name. */
export const NAME_VARIABLE = 'shortcutName';
