import { basename, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Coverage lands in `coverage/<project>` - every project is named after its directory, and deriving it from the path
 * rather than `NX_TASK_TARGET_PROJECT` lets the `@nx/vitest` plugin resolve the target's outputs at graph time.
 */
export function createVitestConfig(projectRoot: string) {
  const projectName = basename(projectRoot);

  return defineConfig({
    root: projectRoot,
    test: {
      name: projectName,
      include: ['src/**/*.spec.ts'],
      passWithNoTests: true,
      silent: true,
      clearMocks: true,
      coverage: {
        enabled: true,
        provider: 'v8',
        reporter: ['lcov', 'cobertura', 'text', 'text-summary'],
        reportsDirectory: resolve(import.meta.dirname, 'coverage', projectName),
        exclude: [
          '**/main.ts',
          '**/index.ts',
          '**/yaml/**',
          '**/*.yaml',
          '**/tests/**',
          '**/config/**',
          '**/*.{config,provider,module,mock,secret,enum,dto,decorator,spec}.ts',
        ],
      },
    },
  });
}
