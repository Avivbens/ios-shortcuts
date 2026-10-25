import { describe, expect, it } from 'vitest';
import { parametersOf } from '../../mocks/actions.mock';
import { outputOf } from '../references';
import { extractTextFromImage, takeScreenshot } from './media';

describe('media', () => {
  describe('takeScreenshot and extractTextFromImage', () => {
    it('should read text from the screenshot, referenced as "Screenshot" like the decoded AI Response', () => {
      const screenshot = takeScreenshot();

      const [shot, extracted] = parametersOf([screenshot, extractTextFromImage(outputOf(screenshot))]);

      expect(shot).toEqual({ UUID: expect.any(String) });
      expect(extracted).toEqual({
        UUID: expect.any(String),
        WFImage: {
          Value: { OutputName: 'Screenshot', OutputUUID: shot?.['UUID'], Type: 'ActionOutput' },
          WFSerializationType: 'WFTextTokenAttachment',
        },
      });
    });
  });
});
