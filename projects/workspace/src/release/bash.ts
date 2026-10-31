import { $, type TShell } from 'zurk';

/**
 * zurk quotes arguments in bash's `$'...'` form but runs them in `/bin/sh`, which is dash on the Ubuntu runner, so
 * `release/*` reached git as `$release/*`. A fresh preset per call, as zurk writes each command into its preset.
 */
export function bash(options: { input?: string } = {}): TShell {
  return $({ ...options, shell: 'bash' });
}
