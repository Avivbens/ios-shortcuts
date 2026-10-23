import { basename } from 'node:path';
import {
  CreateNodes,
  CreateNodesContext,
  CreateNodesResult,
  TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';

/**
 * Determines the correct tsconfig file to use based on project type.
 * - Applications (in projects/apps/) should use tsconfig.app.json
 * - Libraries (in projects/libs/) should use tsconfig.lib.json
 */
const findTsconfig = (configFilePath: string) => {
  const filename = basename(configFilePath);
  return filename;
};

function buildTypecheckTarget(
  configFilePath: string,
  _options: unknown,
  _context: CreateNodesContext,
): CreateNodesResult {
  const projectRoot = configFilePath.split('/').slice(0, -1).join('/');

  const tsconfig = findTsconfig(configFilePath);

  if (!tsconfig) return {};

  const target: TargetConfiguration = {
    executor: 'nx:run-commands',
    cache: true,
    inputs: ['default', '^default', 'plugins'],
    outputs: [], // absolutely no files written
    options: {
      cwd: `{projectRoot}`,
      command: `tsc -p ${tsconfig} --noEmit`,
      parallel: false,
      color: true,
    },
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          typecheck: target,
        },
      },
    },
  };
}

export const createNodesV2: CreateNodes = [
  // Only match tsconfig.app.json and tsconfig.lib.json to avoid duplicate targets
  '**/{tsconfig.app.json,tsconfig.lib.json}',
  async (configFilePaths, options, context) => {
    return await createNodesFromFiles(buildTypecheckTarget, configFilePaths, options, context);
  },
];

export const createNodes = createNodesV2;

export default createNodesV2;
