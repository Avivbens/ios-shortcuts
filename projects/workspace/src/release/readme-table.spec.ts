import { describe, expect, it } from 'vitest';
import { replaceReadmeTable, toReadmeTable } from './readme-table';
import type { ShortcutProject } from './shortcut-projects';

const AI_RESPONSE: ShortcutProject = {
  name: 'ai-response',
  root: 'projects/packages/ai-response',
  version: '0.2.3',
  description: 'Get AI suggestions for your current chat (support any chat app)',
  displayName: 'AI Response',
};

const DOWNLOAD =
  'https://github.com/Avivbens/ios-shortcuts/releases/download/release/ai-response/0.2.2/AI.Response.shortcut';

describe('readme-table', () => {
  describe('toReadmeTable', () => {
    it('should list the version shortcuts.json serves, not the one package.json is at', () => {
      const table = toReadmeTable([AI_RESPONSE], { 'ai-response': { version: '0.2.2', download: DOWNLOAD } });

      expect(table).toContain('| [AI Response](./projects/packages/ai-response/README.md) |');
      expect(table).toContain(
        '[v0.2.2](https://github.com/Avivbens/ios-shortcuts/releases/tag/release/ai-response/0.2.2)',
      );
      expect(table).toContain(`[Download Shortcut](${DOWNLOAD})`);
    });

    it('should leave out a shortcut shortcuts.json does not serve yet', () => {
      expect(toReadmeTable([AI_RESPONSE], {})).not.toContain('AI Response');
    });
  });

  describe('replaceReadmeTable', () => {
    it('should replace only the lines between the markers', () => {
      const readme = ['# Shortcuts', '<!-- TABLE_START -->', 'old table', '<!-- TABLE_END -->', 'footer'].join('\n');

      expect(replaceReadmeTable(readme, 'new table')).toBe(
        ['# Shortcuts', '<!-- TABLE_START -->', 'new table', '<!-- TABLE_END -->', 'footer'].join('\n'),
      );
    });

    it('should refuse a README without the markers rather than write the table elsewhere', () => {
      expect(() => replaceReadmeTable('# Shortcuts', 'new table')).toThrow('TABLE_START');
    });
  });
});
