export function unwrapCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const root = payload as { data?: unknown };
    if (Array.isArray(root.data)) return root.data as T[];

    if (root.data && typeof root.data === 'object') {
      const nested = root.data as { data?: unknown };
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
  }

  return [];
}
