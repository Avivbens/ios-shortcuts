import { REPO_URL } from './release.constants';
import type { ShortcutProject } from './shortcut-projects';

export function toReleaseTag(name: string, version: string): string {
  return `release/${name}/${version}`;
}

export function parseReleaseTag(tag: string): { name: string; version: string } {
  const [prefix, name, version, ...rest] = tag.split('/');
  if (prefix !== 'release' || !name || !version || rest.length) {
    throw new Error(`${tag} is not a release tag - expected release/<project>/<version>`);
  }

  return { name, version };
}

/**
 * The signed file's name, which is also the release asset's. Shortcuts installs a download under its file name, so it is
 * the display name; GitHub turns every character but letters, digits, `.`, `-` and `_` into a dot, so the name is built
 * that way up front and matches the asset GitHub serves.
 */
export function toAssetName(displayName: string): string {
  return `${displayName.replace(/[^\w.-]/g, '.')}.shortcut`;
}

export function toAssetUrl({
  name,
  version,
  displayName,
}: Pick<ShortcutProject, 'name' | 'version' | 'displayName'>): string {
  return `${REPO_URL}/releases/download/${toReleaseTag(name, version)}/${toAssetName(displayName)}`;
}

export function toReleaseUrl(name: string, version: string): string {
  return `${REPO_URL}/releases/tag/${toReleaseTag(name, version)}`;
}

export function toDownloadsBadgeUrl(name: string, version: string): string {
  const tag = encodeURIComponent(toReleaseTag(name, version));

  return `https://img.shields.io/github/downloads/Avivbens/ios-shortcuts/${tag}/total?label=Version%20Downloads&color=blue`;
}
