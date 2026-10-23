import type { ExecutorContext } from '@nx/devkit';

export function toExecutorContext(root: string, projectName?: string): ExecutorContext {
  return {
    root,
    cwd: root,
    isVerbose: false,
    projectName,
    projectsConfigurations: {
      version: 2,
      projects: { 'ai-response': { root: 'projects/packages/ai-response' } },
    },
    nxJsonConfiguration: {},
    projectGraph: { nodes: {}, dependencies: {} },
  };
}
