import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { FaqPage } from './FaqPage';

const apiFaqs = [
  { id: 1, question: 'How do you ship?', answer: 'Through admin configured shipping.', category: 'Shipping' },
  { id: 2, question: 'Can I edit products?', answer: 'Products are managed in admin.', category: 'Products' },
];

vi.mock('@/features/cms/api', () => ({
  useFaqsQuery: () => ({
    data: { data: apiFaqs },
    isLoading: false,
  }),
}));

describe('FaqPage', () => {
  it('renders heading', () => {
    renderWithProviders(<FaqPage />);
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders(<FaqPage />);
    expect(screen.getByText(/find answers to common questions/i)).toBeInTheDocument();
  });

  it('renders FAQ questions from the CMS API', () => {
    renderWithProviders(<FaqPage />);
    for (const faq of apiFaqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it('groups FAQs by category', () => {
    renderWithProviders(<FaqPage />);
    const categories = [...new Set(apiFaqs.map(f => f.category))];
    for (const cat of categories) {
      expect(screen.getByRole('heading', { name: cat })).toBeInTheDocument();
    }
  });

  it('toggles FAQ answer on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FaqPage />);
    const firstQuestion = screen.getByText(apiFaqs[0].question);
    // Answer should not be visible initially
    expect(screen.queryByText(apiFaqs[0].answer)).not.toBeInTheDocument();
    // Click question
    await user.click(firstQuestion);
    expect(screen.getByText(apiFaqs[0].answer)).toBeInTheDocument();
  });

  it('closes answer when clicking again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FaqPage />);
    const firstQuestion = screen.getByText(apiFaqs[0].question);
    await user.click(firstQuestion);
    expect(screen.getByText(apiFaqs[0].answer)).toBeInTheDocument();
    await user.click(firstQuestion);
    expect(screen.queryByText(apiFaqs[0].answer)).not.toBeInTheDocument();
  });
});
