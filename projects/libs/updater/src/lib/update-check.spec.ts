import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { NAME_VARIABLE, VERSION_VARIABLE } from '@ios-shortcuts/builder';
import type { Action, Step, TextTemplate } from '@ios-shortcuts/shortcut';
import { updateCheck } from './update-check';

function toActions(steps: Step[]): Action[] {
  return steps.flatMap((step) =>
    step.kind === 'block' ? toActions(step.sections.flatMap((section) => section.steps)) : [step],
  );
}

function isTextTemplate(value: unknown): value is TextTemplate {
  return typeof value === 'object' && value !== null && 'segments' in value;
}

/** Runs the compare script the shortcut ships, with both versions filled in, and returns what it prints. */
function toVerdict(latest: string, current: string): string {
  const script = toActions(updateCheck({ name: 'ai-response', version: current })).find(
    ({ parameters }) => parameters['CustomOutputName'] === 'JavaScript',
  )?.parameters['WFTextActionText'];
  if (!isTextTemplate(script)) {
    throw new Error('updateCheck has no compare script');
  }

  const source = script.segments
    .map((segment) => {
      if (typeof segment === 'string') {
        return segment;
      }

      return segment.kind === 'variable' && segment.name === 'latestVersion' ? latest : current;
    })
    .join('');
  let verdict = '';
  runInNewContext(source.replace('<script>', '').replace('</script>', ''), {
    document: { write: (value: unknown) => (verdict = String(value)) },
  });

  return verdict;
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

    it.each([
      ['0.2.4', '0.2.3'],
      ['0.3.0', '0.2.9'],
      ['1.0.0', '0.9.9'],
      ['0.2.10', '0.2.9'],
    ])('should offer %s over %s, comparing each part as a number', (latest, current) => {
      expect(toVerdict(latest, current)).toBe('true');
    });

    it.each([
      ['0.2.9', '0.3.0'],
      ['0.2.9', '0.2.10'],
      ['0.2.3', '0.2.3'],
    ])('should not offer %s over %s, so a newer copy is never pushed back', (latest, current) => {
      expect(toVerdict(latest, current)).toBe('false');
    });
  });
});
