import { $ } from 'zurk';

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

/** GitHub ties only some commits of a rebase-merged PR to it, so every commit of the push is looked up. */
async function getMergedPullRequests(before: string, after: string): Promise<number[]> {
  const commits = toLines(await $`git rev-list ${`${before}..${after}`}`);
  const numbers = await Promise.all(
    commits.map(async (sha) =>
      toLines(await $`gh api ${`repos/{owner}/{repo}/commits/${sha}/pulls`} --jq ${'.[].number'}`),
    ),
  );

  return [...new Set(numbers.flat().map(Number))].sort((left, right) => left - right);
}

/** Comments the attach commands on every PR the push merged, once `nx release` has tagged HEAD. */
export async function commentReleaseOnPullRequests(before: string, after: string): Promise<number[]> {
  const tags = toLines(await $`git tag --points-at HEAD --list ${'release/*'}`).sort();
  if (!tags.length) {
    return [];
  }

  const pullRequests = await getMergedPullRequests(before, after);
  const body = toReleaseComment(tags);
  await Promise.all(pullRequests.map((number) => $({ input: body })`gh pr comment ${number} --body-file -`));

  return pullRequests;
}
