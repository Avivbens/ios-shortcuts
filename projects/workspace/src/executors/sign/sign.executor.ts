import { join } from 'node:path';
import { readShortcutConfig, signShortcut } from '@ios-shortcuts/builder';
import { type ExecutorContext, logger } from '@nx/devkit';
import { toAssetName } from '../../release/release-urls';
import { getProject } from '../common/get-project';
import type { SignExecutorSchema } from './sign.schema';

export async function signExecutor(
  _options: SignExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const { name, projectRoot } = getProject(context);
  const { name: displayName } = await readShortcutConfig(projectRoot);
  const outputPath = join(context.root, 'dist', name, toAssetName(displayName));

  const sha256 = await signShortcut({
    inputPath: join(context.root, 'dist', name, `${name}.plist`),
    displayName,
    outputPath,
  });
  logger.log(`signed ${outputPath} (sha256 ${sha256})`);

  return { success: true };
}

export default signExecutor;
