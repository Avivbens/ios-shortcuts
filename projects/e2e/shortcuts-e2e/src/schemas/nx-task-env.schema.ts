import { z } from 'zod';
import type { ProjectGraph } from '@nx/devkit';

export function createNxTaskEnvSchema(graph: ProjectGraph) {
  return z.object({
    NX_TASK_TARGET_PROJECT: z
      .string({
        error: ({ input }) =>
          input === undefined ? 'NX_TASK_TARGET_PROJECT is not set - run this suite through `nx test`' : undefined,
      })
      .refine((project) => project in graph.nodes, {
        error: ({ input }) => `NX_TASK_TARGET_PROJECT "${input}" is not a project in the Nx graph`,
      }),
  });
}
