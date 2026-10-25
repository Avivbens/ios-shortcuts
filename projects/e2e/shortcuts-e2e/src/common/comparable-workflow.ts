import type { ShortcutWorkflow } from '@ios-shortcuts/builder';

const UUID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const TRAILING_SPACES = / +$/;

function collectOutputUuids(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectOutputUuids);
  }

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, item]) =>
    key === 'OutputUUID' && typeof item === 'string' ? [item] : collectOutputUuids(item),
  );
}

function dropUnreferencedUuids(value: unknown, referenced: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => dropUnreferencedUuids(item, referenced));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, item]) => key !== 'UUID' || (typeof item === 'string' && referenced.has(item)))
      .map(([key, item]) => [key, dropUnreferencedUuids(item, referenced)]),
  );
}

function toComparableValue(value: unknown, names: Map<string, string>): unknown {
  if (typeof value === 'string') {
    if (!UUID_PATTERN.test(value)) {
      return value.replace(TRAILING_SPACES, '');
    }

    const name = names.get(value) ?? `uuid-${names.size + 1}`;
    names.set(value, name);

    return name;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toComparableValue(item, names));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, toComparableValue(item, names)]),
  );
}

/**
 * Shortcuts stamps a UUID on some actions nothing references, and every build mints its own values. So unreferenced
 * UUIDs are dropped and the rest renamed by first appearance - two workflows then compare equal exactly when they
 * hold the same actions, wired the same way. Trailing spaces are trimmed too: the signed releases carry stray ones in
 * titles that the sources drop.
 */
export function toComparableWorkflow(workflow: ShortcutWorkflow): unknown {
  const referenced = new Set(collectOutputUuids(workflow.WFWorkflowActions));

  return toComparableValue(dropUnreferencedUuids(workflow, referenced), new Map());
}
