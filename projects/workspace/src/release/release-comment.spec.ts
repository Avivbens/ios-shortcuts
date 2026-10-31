import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commentReleaseOnPullRequests, toReleaseComment } from './release-comment';

const { $ } = vi.hoisted(() => ({ $: vi.fn() }));
vi.mock('zurk', () => ({ $ }));

type Call = [TemplateStringsArray, ...unknown[]];

/** The push that merged #68, #69 and #70; GitHub ties none of #69's first commit to it. */
const PULLS: Record<string, string> = {
  '8a2b896': '70',
  '8d96abd': '69',
  a9d1828: '',
  b5f882c: '68',
};

function toCommand([literals, ...values]: Call): string {
  return String.raw({ raw: literals }, ...values);
}

/** Answers git and gh like the release job, and records each comment with the body it got. */
function answer(tags: string[]): { number: string; body: string }[] {
  const comments: { number: string; body: string }[] = [];
  $.mockImplementation((...call: Call | [{ input: string }]) => {
    if (!Array.isArray(call[0])) {
      const { input } = call[0] as { input: string };

      return (...comment: Call) => {
        comments.push({ number: toCommand(comment).split(' ')[3] ?? '', body: input });

        return Promise.resolve({ toString: () => '' });
      };
    }

    const command = toCommand(call as Call);
    const sha = Object.keys(PULLS).find((key) => command.includes(`/commits/${key}/`));
    const stdout = command.startsWith('git tag')
      ? tags.join('\n')
      : command.startsWith('git rev-list')
        ? Object.keys(PULLS).join('\n')
        : (PULLS[sha ?? ''] ?? '');

    return Promise.resolve({ toString: () => stdout });
  });

  return comments;
}

describe('release-comment', () => {
  beforeEach(() => {
    $.mockReset();
  });

  describe('toReleaseComment', () => {
    it('should give one attach per tag, in the order the runbook runs them', () => {
      expect(toReleaseComment(['release/ai-response/0.2.4', 'release/translate-text/0.2.5'])).toContain(
        [
          'git fetch --tags',
          'git switch --detach release/ai-response/0.2.4',
          'pnpm install --frozen-lockfile',
          'pnpm run attach-asset release/ai-response/0.2.4',
          'git switch --detach release/translate-text/0.2.5',
          'pnpm install --frozen-lockfile',
          'pnpm run attach-asset release/translate-text/0.2.5',
          'git switch master',
        ].join('\n'),
      );
    });
  });

  describe('commentReleaseOnPullRequests', () => {
    it('should comment on every PR the push merged, even one GitHub ties to a single commit', async () => {
      const comments = answer(['release/translate-text/0.2.5', 'release/ai-response/0.2.4']);

      expect(await commentReleaseOnPullRequests('94cdbb1', '8a2b896')).toEqual([68, 69, 70]);
      expect(comments.map(({ number }) => number)).toEqual(['68', '69', '70']);
      expect(comments[0]?.body).toContain('Released `release/ai-response/0.2.4`, `release/translate-text/0.2.5`');
    });

    it('should stay quiet when the push released nothing', async () => {
      const comments = answer([]);

      expect(await commentReleaseOnPullRequests('94cdbb1', '8a2b896')).toEqual([]);
      expect(comments).toEqual([]);
    });
  });
});
