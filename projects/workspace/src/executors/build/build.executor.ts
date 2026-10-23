import { join } from 'node:path';
import { compileShortcut } from '@ios-shortcuts/builder';
import type { ExecutorContext } from '@nx/devkit';
import { getProject } from '../common/get-project';
import { getVersion } from '../common/get-version';
import type { BuildExecutorSchema } from './build.schema';

export async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const { name, projectRoot } = getProject(context);
  const version = await getVersion(projectRoot, options.version);

  await compileShortcut({
    projectRoot,
    name,
    version,
    outputPath: join(context.root, 'dist', name, `${name}.plist`),
  });

  return { success: true };
}

export default buildExecutor;
