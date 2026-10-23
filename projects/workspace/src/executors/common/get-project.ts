import { join } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';

interface Project {
  name: string;
  projectRoot: string;
}

export function getProject({ root, projectName, projectsConfigurations }: ExecutorContext): Project {
  const project = projectName ? projectsConfigurations.projects[projectName] : undefined;
  if (!projectName || !project) {
    throw new Error('This executor must run as a project target');
  }

  return { name: projectName, projectRoot: join(root, project.root) };
}
