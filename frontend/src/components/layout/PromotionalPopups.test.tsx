import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PromotionalPopups } from '@/components/layout/PromotionalPopups';

const useActivePopupsQueryMock = vi.fn();

vi.mock('@/features/cms/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/cms/api')>();
  return {
    ...actual,
    useActivePopupsQuery: () => useActivePopupsQueryMock(),
  };
});

describe('PromotionalPopups', () => {
  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    useActivePopupsQueryMock.mockReset();
  });

  it('does not crash when the popup API returns a wrapped collection shape', () => {
    useActivePopupsQueryMock.mockReturnValue({
      data: {
        data: {
          data: [],
        },
      },
    });

    expect(() => renderWithProviders(<PromotionalPopups />)).not.toThrow();
  });
});
