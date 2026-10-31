import type { ShortcutsManifest } from '@ios-shortcuts/builder';
import { toAssetUrl } from './release-urls';
import type { ShortcutProject } from './shortcut-projects';

interface AdvancedManifest {
  manifest: ShortcutsManifest;
  unpublished: ShortcutProject[];
}

/**
 * Installed copies download whatever an entry points at, so an entry moves to a new version only once that version's
 * signed asset is attached. Until then it keeps its previous entry, and the shortcut is reported as unpublished.
 */
export async function advanceManifest(
  manifest: ShortcutsManifest,
  shortcuts: ShortcutProject[],
  isPublished: (url: string) => Promise<boolean>,
): Promise<AdvancedManifest> {
  const advanced = await Promise.all(
    shortcuts.map(async (shortcut) => {
      const download = toAssetUrl(shortcut);

      return {
        shortcut,
        entry: (await isPublished(download)) ? { version: shortcut.version, download } : undefined,
      };
    }),
  );

  return {
    manifest: Object.fromEntries(
      advanced.flatMap(({ shortcut, entry }) => {
        const current = entry ?? manifest[shortcut.name];

        return current ? [[shortcut.name, current]] : [];
      }),
    ),
    unpublished: advanced.filter(({ entry }) => !entry).map(({ shortcut }) => shortcut),
  };
}
