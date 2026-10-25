import { describe, expect, it } from 'vitest';
import { toAssetUrl, toDownloadsBadgeUrl, toReleaseUrl } from './release-urls';

describe('release-urls', () => {
  describe('toAssetUrl', () => {
    it('should point at the signed file attached to the release tag', () => {
      expect(toAssetUrl('ai-response', '0.2.3')).toBe(
        'https://github.com/Avivbens/ios-shortcuts/releases/download/release/ai-response/0.2.3/ai-response_0.2.3.shortcut',
      );
    });
  });

  describe('toReleaseUrl', () => {
    it('should point at the release page of the tag', () => {
      expect(toReleaseUrl('ai-response', '0.2.3')).toBe(
        'https://github.com/Avivbens/ios-shortcuts/releases/tag/release/ai-response/0.2.3',
      );
    });
  });

  describe('toDownloadsBadgeUrl', () => {
    it('should escape the slashes of the tag, which the badge path cannot hold', () => {
      expect(toDownloadsBadgeUrl('ai-response', '0.2.3')).toContain('/release%2Fai-response%2F0.2.3/total');
    });
  });
});
