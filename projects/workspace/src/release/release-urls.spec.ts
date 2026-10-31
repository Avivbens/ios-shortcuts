import { describe, expect, it } from 'vitest';
import { parseReleaseTag, toAssetName, toAssetUrl, toDownloadsBadgeUrl, toReleaseUrl } from './release-urls';

describe('release-urls', () => {
  describe('parseReleaseTag', () => {
    it('should read the project and version from a tag nx release cut', () => {
      expect(parseReleaseTag('release/ai-response/0.2.3')).toEqual({ name: 'ai-response', version: '0.2.3' });
    });

    it('should refuse anything else, such as a branch name', () => {
      expect(() => parseReleaseTag('feat/attach-asset')).toThrow('release/<project>/<version>');
    });
  });

  describe('toAssetName', () => {
    it('should use the display name, with the dot GitHub stores in place of each space', () => {
      expect(toAssetName('AI Response')).toBe('AI.Response.shortcut');
      expect(toAssetName('Translate Text')).toBe('Translate.Text.shortcut');
    });
  });

  describe('toAssetUrl', () => {
    it('should point at the signed file attached to the release tag', () => {
      expect(toAssetUrl({ name: 'ai-response', version: '0.2.3', displayName: 'AI Response' })).toBe(
        'https://github.com/Avivbens/ios-shortcuts/releases/download/release/ai-response/0.2.3/AI.Response.shortcut',
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
