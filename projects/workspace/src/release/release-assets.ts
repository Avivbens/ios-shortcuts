/** GitHub answers a missing release asset with 404, and an attached one with a redirect to its file. */
export async function isAssetPublished(url: string): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD' });

  return response.ok;
}
