import { describe, expect, it } from 'vitest';
import { NAME_VARIABLE, VERSION_VARIABLE } from '@ios-shortcuts/builder';
import type { Action, Step } from '@ios-shortcuts/shortcut';
import { updateCheck } from './update-check';

function toActions(steps: Step[]): Action[] {
  return steps.flatMap((step) =>
    step.kind === 'block' ? toActions(step.sections.flatMap((section) => section.steps)) : [step],
  );
}

describe('update-check', () => {
  describe('updateCheck', () => {
    it('should store the version and name in the variables the builder checks', () => {
      const [version, storedVersion, name, storedName] = updateCheck({ name: 'ai-response', version: '1.2.3' });

      expect(version).toMatchObject({ parameters: { WFTextActionText: '1.2.3' } });
      expect(storedVersion).toMatchObject({ parameters: { WFVariableName: VERSION_VARIABLE } });
      expect(name).toMatchObject({ parameters: { WFTextActionText: 'ai-response' } });
      expect(storedName).toMatchObject({ parameters: { WFVariableName: NAME_VARIABLE } });
    });

    it('should fetch the root shortcuts.json on master, the URL installed copies already use', () => {
      const actions = toActions(updateCheck({ name: 'ai-response', version: '1.2.3' }));

      expect(actions).toContainEqual(
        expect.objectContaining({
          identifier: 'is.workflow.actions.downloadurl',
          parameters: {
            WFURL: 'https://raw.githubusercontent.com/Avivbens/ios-shortcuts/refs/heads/master/shortcuts.json',
          },
        }),
      );
    });
  });
});
