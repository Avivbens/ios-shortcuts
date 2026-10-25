import type { ShortcutsManifest } from '@ios-shortcuts/builder';
import { toDownloadsBadgeUrl, toReleaseUrl } from './release-urls';
import { REPO_URL, TABLE_END_MARKER, TABLE_START_MARKER } from './release.constants';
import type { ShortcutProject } from './shortcut-projects';

const HEADER = [
  '| Shortcut | Description | Latest Release | Download Link | Downloads |',
  '| -------- | ----------- | -------------- | ------------- | --------- |',
];

function toRow({ name, root, description, displayName }: ShortcutProject, version: string, download: string): string {
  const downloads = `[![Version Downloads](${toDownloadsBadgeUrl(name, version)})](${REPO_URL}/releases)`;

  return `| [${displayName}](./${root}/README.md) | ${description} | [v${version}](${toReleaseUrl(name, version)}) | [Download Shortcut](${download}) | ${downloads} |`;
}

/** The table lists what `shortcuts.json` serves, so every link in it is a file that can be downloaded. */
export function toReadmeTable(shortcuts: ShortcutProject[], manifest: ShortcutsManifest): string {
  const rows = shortcuts.flatMap((shortcut) => {
    const entry = manifest[shortcut.name];

    return entry ? [toRow(shortcut, entry.version, entry.download)] : [];
  });

  return ['', ...HEADER, ...rows, ''].join('\n');
}

export function replaceReadmeTable(readme: string, table: string): string {
  const lines = readme.split('\n');
  const start = lines.findIndex((line) => line.includes(TABLE_START_MARKER));
  const end = lines.findIndex((line) => line.includes(TABLE_END_MARKER));
  if (start === -1 || end < start) {
    throw new Error(`README.md needs ${TABLE_START_MARKER} followed by ${TABLE_END_MARKER}`);
  }

  return [...lines.slice(0, start + 1), table, ...lines.slice(end)].join('\n');
}
