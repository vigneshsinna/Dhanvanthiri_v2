import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { GlobalAlerts } from '@/components/layout/GlobalAlerts';

const useActiveAlertsQueryMock = vi.fn();

vi.mock('@/features/cms/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/cms/api')>();
  return {
    ...actual,
    useActiveAlertsQuery: () => useActiveAlertsQueryMock(),
  };
});

describe('GlobalAlerts', () => {
  beforeEach(() => {
    localStorage.clear();
    useActiveAlertsQueryMock.mockReset();
  });

  it('does not crash when the alerts API returns a wrapped collection shape', () => {
    useActiveAlertsQueryMock.mockReturnValue({
      data: {
        data: {
          data: [],
        },
      },
    });

    expect(() => renderWithProviders(<GlobalAlerts />)).not.toThrow();
  });
});
