import { env } from 'node:process';
import { z } from 'zod';
import { logger } from '@nx/devkit';
import { commentReleaseOnPullRequests } from '../release/release-comment';

const ReleaseEnvSchema = z.object({ RELEASE_BEFORE: z.string().min(1), RELEASE_AFTER: z.string().min(1) });

(async () => {
  const { RELEASE_BEFORE, RELEASE_AFTER } = ReleaseEnvSchema.parse(env);
  const pullRequests = await commentReleaseOnPullRequests(RELEASE_BEFORE, RELEASE_AFTER);

  logger.log(
    pullRequests.length
      ? `commented the attach commands on ${pullRequests.map((number) => `#${number}`).join(', ')}`
      : 'this push released nothing',
  );
})();
