import { describe, expect, it } from 'vitest';
import type { ShortcutProject } from './shortcut-projects';
import { advanceManifest } from './shortcuts-manifest';

/** The root `shortcuts.json` before any signed release was attached. */
const MANIFEST = {
  'ai-response': {
    version: '0.2.2',
    download:
      'https://github.com/Avivbens/ios-shortcuts/raw/refs/heads/master/projects/packages/ai-response/src/AI%20Response.shortcut',
  },
};

const AI_RESPONSE: ShortcutProject = {
  name: 'ai-response',
  root: 'projects/packages/ai-response',
  version: '0.2.3',
  description: 'Get AI suggestions for your current chat (support any chat app)',
  displayName: 'AI Response',
};

const NEW_SHORTCUT: ShortcutProject = { ...AI_RESPONSE, name: 'new-shortcut', root: 'projects/packages/new-shortcut' };

describe('shortcuts-manifest', () => {
  describe('advanceManifest', () => {
    it('should move an entry to its new version once the signed asset is attached', async () => {
      const { manifest, unpublished } = await advanceManifest(MANIFEST, [AI_RESPONSE], async () => true);

      expect(manifest).toEqual({
        'ai-response': {
          version: '0.2.3',
          download:
            'https://github.com/Avivbens/ios-shortcuts/releases/download/release/ai-response/0.2.3/AI.Response.shortcut',
        },
      });
      expect(unpublished).toEqual([]);
    });

    it('should keep the previous entry until the signed asset is attached, so installed copies never get a dead link', async () => {
      const { manifest, unpublished } = await advanceManifest(MANIFEST, [AI_RESPONSE], async () => false);

      expect(manifest).toEqual(MANIFEST);
      expect(unpublished).toEqual([AI_RESPONSE]);
    });

    it('should leave out a shortcut that was never released', async () => {
      const { manifest, unpublished } = await advanceManifest(MANIFEST, [AI_RESPONSE, NEW_SHORTCUT], async (url) =>
        url.includes('/ai-response/'),
      );

      expect(Object.keys(manifest)).toEqual(['ai-response']);
      expect(unpublished).toEqual([NEW_SHORTCUT]);
    });
  });
});
