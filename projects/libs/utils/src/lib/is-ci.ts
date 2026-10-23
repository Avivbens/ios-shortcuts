/** CI providers set `CI` (GitHub Actions to `true`), and `CI=false` is the usual way to opt a run out. */
export function isCi(): boolean {
  const ci = process.env['CI'];

  return !!ci && ci !== 'false';
}
