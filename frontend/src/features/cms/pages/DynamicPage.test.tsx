import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { DynamicPage } from './DynamicPage';

let currentSlug = 'unknown-page';
let currentQueryResult = {
  data: null,
  isLoading: false,
  error: new Error('not found'),
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: currentSlug }),
  };
});

vi.mock('@/features/cms/api', () => ({
  usePageQuery: () => currentQueryResult,
}));

describe('DynamicPage', () => {
  beforeEach(() => {
    currentSlug = 'unknown-page';
    currentQueryResult = {
      data: null,
      isLoading: false,
      error: new Error('not found'),
    };
  });

  it('renders coming soon for unknown page slugs', () => {
    renderWithProviders(<DynamicPage />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('renders a Go Home link', () => {
    renderWithProviders(<DynamicPage />);
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/');
  });

  it('shows explanatory text', () => {
    renderWithProviders(<DynamicPage />);
    expect(screen.getByText(/we're working on this page/i)).toBeInTheDocument();
  });

  it('does not render bundled fallback content for shipping policy when CMS API is unavailable', () => {
    currentSlug = 'shipping-policy';

    renderWithProviders(<DynamicPage />);

    expect(screen.queryByRole('heading', { name: /shipping policy/i })).not.toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText(/this shipping policy explains how dhanvanthiri foods processes/i)).not.toBeInTheDocument();
  });

  it('does not render bundled fallback content for terms and conditions when CMS API is unavailable', () => {
    currentSlug = 'terms-and-conditions';

    renderWithProviders(<DynamicPage />);

    expect(screen.queryByRole('heading', { name: /terms/i })).not.toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText(/these terms .* explain the rules for using the dhanvanthiri foods website/i)).not.toBeInTheDocument();
  });
});
