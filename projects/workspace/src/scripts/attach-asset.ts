import { argv, cwd } from 'node:process';
import { logger } from '@nx/devkit';
import { attachReleaseAsset } from '../release/attach-release-asset';

(async () => {
  const [tag = ''] = argv.slice(2);
  const asset = await attachReleaseAsset(cwd(), tag);

  logger.log(`attached ${asset} to ${tag}; the README sync now runs on GitHub`);
})();
