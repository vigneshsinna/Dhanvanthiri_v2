export function getSettingsFormValues(payload: { data?: Record<string, unknown> } | null | undefined): Record<string, string> {
  const rawSettings = unwrapSettingsPayload(payload);

  if (!rawSettings) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawSettings).map(([key, value]) => [key, stringifySettingValue(value)]),
  );
}

export function toSettingsMutationPayload(group: string, values: Record<string, unknown>) {
  return {
    settings: Object.entries(values).map(([key, value]) => ({
      group,
      key,
      value: normalizeSettingValue(value),
    })),
  };
}

function normalizeSettingValue(value: unknown): unknown {
  if (value === '1') return true;
  if (value === '0') return false;
  return value;
}

function stringifySettingValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (value == null) return '';
  return String(value);
}

function unwrapSettingsPayload(payload: { data?: Record<string, unknown> } | null | undefined): Record<string, unknown> | null {
  if (!payload?.data || typeof payload.data !== 'object') {
    return null;
  }

  const nestedData = payload.data.data;
  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    return nestedData as Record<string, unknown>;
  }

  return payload.data;
}
