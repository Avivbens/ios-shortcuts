import { REPO_URL } from './release.constants';

export function toReleaseTag(name: string, version: string): string {
  return `release/${name}/${version}`;
}

/** The signed file's name, which is also the release asset's - the signer and the sync must agree on it. */
export function toAssetName(name: string, version: string): string {
  return `${name}_${version}.shortcut`;
}

export function toAssetUrl(name: string, version: string): string {
  return `${REPO_URL}/releases/download/${toReleaseTag(name, version)}/${toAssetName(name, version)}`;
}

export function toReleaseUrl(name: string, version: string): string {
  return `${REPO_URL}/releases/tag/${toReleaseTag(name, version)}`;
}

export function toDownloadsBadgeUrl(name: string, version: string): string {
  const tag = encodeURIComponent(toReleaseTag(name, version));

  return `https://img.shields.io/github/downloads/Avivbens/ios-shortcuts/${tag}/total?label=Version%20Downloads&color=blue`;
}
