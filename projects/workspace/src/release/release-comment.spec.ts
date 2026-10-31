import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commentReleaseOnPullRequests, toReleaseComment } from './release-comment';

const { $ } = vi.hoisted(() => ({ $: vi.fn() }));
vi.mock('zurk', () => ({ $ }));

type Call = [TemplateStringsArray, ...unknown[]];

/** The stack push that merged #79 and #80, before GitHub linked any of its commits to them. */
const PUSHED = ['9e5f498', '954ef32', '1f97c7e', '3768db9', '3c6d3ab', '0668132', '474d20c', '6c88a9f'];

/** Recently merged PRs with the last commit each merge added; #78 merged in an earlier push. */
const MERGED = ['80 9e5f498', '79 6c88a9f', '78 fecbebc'];

function toCommand([literals, ...values]: Call): string {
  return String.raw({ raw: literals }, ...values);
}

/** Answers git and gh like the release job, and records each comment with the body it got. */
function answer(tags: string[], merged = MERGED): { number: string; body: string }[] {
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
    const stdout = command.startsWith('git tag')
      ? tags.join('\n')
      : command.startsWith('git rev-list')
        ? PUSHED.join('\n')
        : command.includes('/pulls?')
          ? merged.join('\n')
          : '';

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
    it('should comment on every PR the push merged, found by its merge commit before GitHub links the rest', async () => {
      const comments = answer(['release/translate-text/0.2.6', 'release/ai-response/0.2.5']);

      expect(await commentReleaseOnPullRequests('3cba5fe', '9e5f498')).toEqual([79, 80]);
      expect(comments.map(({ number }) => number)).toEqual(['79', '80']);
      expect(comments[0]?.body).toContain('Released `release/ai-response/0.2.5`, `release/translate-text/0.2.6`');
    });

    it('should stay quiet when the push released nothing', async () => {
      const comments = answer([]);

      expect(await commentReleaseOnPullRequests('3cba5fe', '9e5f498')).toEqual([]);
      expect(comments).toEqual([]);
    });

    it('should fail with the attach commands when the push released but no merged PR is found', async () => {
      answer(['release/ai-response/0.2.5'], []);

      await expect(commentReleaseOnPullRequests('3cba5fe', '9e5f498')).rejects.toThrow(
        'pnpm run attach-asset release/ai-response/0.2.5',
      );
    });
  });
});
