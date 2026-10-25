import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'zurk';
import { parseReleaseTag, toAssetName } from './release-urls';

/** The asset must be the released source itself, so it is signed only from a clean checkout of the tag. */
async function assertCheckedOutAt(tag: string): Promise<void> {
  const [head, tagged, changes] = await Promise.all([
    $`git rev-parse HEAD`,
    $`git rev-parse ${`${tag}^{commit}`}`,
    $`git status --porcelain`,
  ]);
  if (head.toString() !== tagged.toString()) {
    throw new Error(`HEAD is not ${tag} - run \`git switch --detach ${tag}\` first`);
  }

  if (changes.toString()) {
    throw new Error(`The working tree has changes - sign only a clean checkout of ${tag}`);
  }
}

/** Signs the tagged shortcut on this Mac, attaches it to its release, and has CI point shortcuts.json at it. */
export async function attachReleaseAsset(root: string, tag: string): Promise<string> {
  const { name, version } = parseReleaseTag(tag);
  await assertCheckedOutAt(tag);

  await $`pnpm exec nx run ${`${name}:sign:ci`} -- --version ${version}`;
  const asset = join(root, 'dist', name, toAssetName(name, version));
  if (!existsSync(asset)) {
    throw new Error(`sign:ci did not write ${asset}`);
  }

  await $`gh release upload ${tag} ${asset}`;
  await $`gh workflow run sync-readme.yaml`;

  return asset;
}
