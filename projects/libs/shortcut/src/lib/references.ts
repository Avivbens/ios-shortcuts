import { type Reference, type Step, TOKEN, type TextTemplate, type VariableReference } from './step';

/** Declared once per shortcut, since `setVariable` takes the handle - a misspelled name then fails to compile. */
export function variable(name: string): VariableReference {
  return { [TOKEN]: 'reference', kind: 'variable', name };
}

export function shortcutInput(): Reference {
  return { [TOKEN]: 'reference', kind: 'shortcut-input' };
}

export function outputOf(step: Step): Reference {
  if (step.outputName === undefined) {
    throw new Error(`${step.identifier} has no output to reference`);
  }

  return { [TOKEN]: 'reference', kind: 'output', step };
}

function mergeText(segments: (string | Reference)[]): (string | Reference)[] {
  return segments.reduce<(string | Reference)[]>((merged, segment) => {
    const last = merged.at(-1);
    if (typeof segment === 'string' && typeof last === 'string') {
      return [...merged.slice(0, -1), last + segment];
    }

    return segment === '' ? merged : [...merged, segment];
  }, []);
}

/** Plain values are inlined into the text; references become attachments at their place in it. */
export function text(literals: TemplateStringsArray, ...values: (Reference | string)[]): TextTemplate {
  const segments = literals.flatMap((literal, index) => {
    const value = values[index];

    return value === undefined ? [literal] : [literal, value];
  });

  return { [TOKEN]: 'text', segments: mergeText(segments) };
}
