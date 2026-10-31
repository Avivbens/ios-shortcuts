import { bash } from './bash';

function toLines(output: unknown): string[] {
  return String(output)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The CONTRIBUTING runbook, filled in with the tags this release cut, ready to paste on the Mac. */
export function toReleaseComment(tags: string[]): string {
  const attaches = tags.flatMap((tag) => [
    `git switch --detach ${tag}`,
    'pnpm install --frozen-lockfile',
    `pnpm run attach-asset ${tag}`,
  ]);

  return [
    `Released ${tags.map((tag) => `\`${tag}\``).join(', ')}. Attach the signed shortcuts from a Mac signed into iCloud:`,
    '',
    '```bash',
    'git fetch --tags',
    ...attaches,
    'git switch master',
    '```',
  ].join('\n');
}

/**
 * GitHub links a pushed commit to its PR some time after the push, so a lookup by commit can find nothing. A merged
 * PR's `merge_commit_sha` is set as it merges - for a rebase merge, the last commit it added - so the push is matched
 * against that instead.
 */
async function getMergedPullRequests(before: string, after: string): Promise<number[]> {
  const pushed = new Set(toLines(await bash()`git rev-list ${`${before}..${after}`}`));
  const merged = toLines(
    await bash()`gh api ${'repos/{owner}/{repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100'} --jq ${'.[] | select(.merged_at) | "\\(.number) \\(.merge_commit_sha)"'}`,
  );

  return merged
    .map((line) => line.split(' '))
    .filter(([, sha]) => sha !== undefined && pushed.has(sha))
    .map(([number]) => Number(number))
    .sort((left, right) => left - right);
}

/** Comments the attach commands on every PR the push merged, once `nx release` has tagged HEAD. */
export async function commentReleaseOnPullRequests(before: string, after: string): Promise<number[]> {
  const tags = toLines(await bash()`git tag --points-at HEAD --list ${'release/*'}`).sort();
  if (!tags.length) {
    return [];
  }

  const pullRequests = await getMergedPullRequests(before, after);
  const body = toReleaseComment(tags);
  if (!pullRequests.length) {
    throw new Error(`${tags.join(', ')} found no merged PR in ${before}..${after} to comment on\n\n${body}`);
  }

  await Promise.all(pullRequests.map((number) => bash({ input: body })`gh pr comment ${number} --body-file -`));

  return pullRequests;
}
