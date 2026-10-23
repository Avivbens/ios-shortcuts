import { join } from 'node:path';
import { unwrapShortcut } from '@ios-shortcuts/builder';
import type { ExecutorContext } from '@nx/devkit';
import { getProject } from '../common/get-project';
import type { UnwrapExecutorSchema } from './unwrap.schema';

export async function unwrapExecutor(
  options: UnwrapExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const { projectRoot } = getProject(context);

  await unwrapShortcut({ signedPath: join(projectRoot, options.input), projectRoot });

  return { success: true };
}

export default unwrapExecutor;
