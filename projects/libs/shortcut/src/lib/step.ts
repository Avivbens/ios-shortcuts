/** A symbol key, so a reference or text template never collides with a plist dictionary that has the same keys. */
export const TOKEN = Symbol('shortcut-token');

export type Reference =
  | { readonly [TOKEN]: 'reference'; kind: 'variable'; name: string }
  | { readonly [TOKEN]: 'reference'; kind: 'shortcut-input' }
  | { readonly [TOKEN]: 'reference'; kind: 'output'; step: Step };

export interface TextTemplate {
  readonly [TOKEN]: 'text';
  segments: (string | Reference)[];
}

export type ParameterValue =
  string | number | boolean | Reference | TextTemplate | ParameterValue[] | { [key: string]: ParameterValue };

export type Parameters = Record<string, ParameterValue>;

export interface Action {
  kind: 'action';
  identifier: string;
  parameters: Parameters;
  outputName?: string;
}

/** One branch of a control-flow block; a marker becomes the action that opens it, such as a menu item. */
export interface Section {
  marker?: Parameters;
  steps: Step[];
}

/** A menu or conditional: Shortcuts stores it as a start, its sections and an end that share a grouping identifier. */
export interface Block {
  kind: 'block';
  identifier: string;
  start: Parameters;
  sections: Section[];
  outputName?: string;
}

export type Step = Action | Block;

export function isReference(value: unknown): value is Reference {
  return typeof value === 'object' && value !== null && TOKEN in value && value[TOKEN] === 'reference';
}

export function isTextTemplate(value: unknown): value is TextTemplate {
  return typeof value === 'object' && value !== null && TOKEN in value && value[TOKEN] === 'text';
}

export function rawAction(identifier: string, parameters: Parameters, options: { outputName?: string } = {}): Action {
  return { kind: 'action', identifier, parameters, ...options };
}

export function controlFlow(
  identifier: string,
  start: Parameters,
  sections: Section[],
  options: { outputName?: string } = {},
): Block {
  return { kind: 'block', identifier, start, sections, ...options };
}
