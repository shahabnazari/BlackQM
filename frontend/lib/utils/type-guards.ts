// Type Guards for Runtime Type Safety

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function assertDefined<T>(
  value: T | undefined | null,
  message?: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
}

export function assertString(
  value: unknown,
  message?: string
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || 'Value is not a string');
  }
}
