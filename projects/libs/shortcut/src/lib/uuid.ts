import { createHash } from 'node:crypto';

/** UUIDs derived from a counter, so building the same source twice gives a byte-identical plist. */
export function createUuidSequence(seed = 'ios-shortcuts'): () => string {
  let count = 0;

  return function nextUuid(): string {
    count += 1;
    const hex = createHash('sha1').update(`${seed}:${count}`).digest('hex');
    const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16);

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      `5${hex.slice(13, 16)}`,
      `${variant}${hex.slice(17, 20)}`,
      hex.slice(20, 32),
    ]
      .join('-')
      .toUpperCase();
  };
}
