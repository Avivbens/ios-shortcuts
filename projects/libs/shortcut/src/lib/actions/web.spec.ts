import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf, text, variable } from '../references';
import { textAction } from './text';
import { getContentsOfUrl, getWebPageContents, openUrl, url } from './web';

/** Expected values follow the decoded AI Response update check. */
describe('web', () => {
  describe('getContentsOfUrl', () => {
    it('should download a fixed address', () => {
      const address = 'https://raw.githubusercontent.com/Avivbens/ios-shortcuts/refs/heads/master/shortcuts.json';

      expect(parametersOf([getContentsOfUrl(address)])).toEqual([{ UUID: expect.any(String), WFURL: address }]);
    });
  });

  describe('url and getWebPageContents', () => {
    it('should build a data URL from a named text, and read the page through a template', () => {
      const script = textAction('<script></script>', { name: 'JavaScript' });
      const page = url(text`data:text/html,${outputOf(script)}`);

      const [named, address, contents] = parametersOf([script, page, getWebPageContents(text`${outputOf(page)}`)]);

      expect(address).toEqual({
        UUID: expect.any(String),
        WFURLActionURL: {
          Value: {
            attachmentsByRange: {
              '{15, 1}': { OutputName: 'JavaScript', OutputUUID: named?.['UUID'], Type: 'ActionOutput' },
            },
            string: 'data:text/html,\uFFFC',
          },
          WFSerializationType: 'WFTextTokenString',
        },
      });
      expect(contents).toMatchObject({
        WFInput: { Value: { attachmentsByRange: { '{0, 1}': { OutputName: 'URL', OutputUUID: address?.['UUID'] } } } },
      });
    });
  });

  describe('openUrl', () => {
    it('should open a variable, with no output of its own', () => {
      expect(parametersOf([openUrl(variable('shortcutDownloadLink'))])).toEqual([
        {
          WFInput: {
            Value: { Type: 'Variable', VariableName: 'shortcutDownloadLink' },
            WFSerializationType: 'WFTextTokenAttachment',
          },
        },
      ]);
    });
  });
});
