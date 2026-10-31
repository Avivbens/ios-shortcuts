import { basename, extname, join, resolve } from 'node:path';
import { argv } from 'node:process';
import { unwrapShortcut } from '@ios-shortcuts/builder';
import { logger, workspaceRoot } from '@nx/devkit';

(async () => {
  const [input = ''] = argv.slice(2);
  const outputPath = join(workspaceRoot, 'dist', `${basename(input, extname(input))}.unwrapped.plist`);

  await unwrapShortcut({ signedPath: resolve(input), outputPath });

  logger.log(`unwrapped ${input} into ${outputPath}`);
})();
