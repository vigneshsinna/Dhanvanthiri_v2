import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { BlogListPage } from './BlogListPage';

const apiPosts = [
  {
    id: 1,
    title: 'Admin Blog Post',
    slug: 'admin-blog-post',
    excerpt: 'Managed by admin',
    published_at: '2026-04-01T00:00:00.000Z',
  },
];

vi.mock('@/features/cms/api', () => ({
  usePostsQuery: () => ({
    data: { data: apiPosts },
    isLoading: false,
  }),
}));

describe('BlogListPage', () => {
  it('renders heading', () => {
    renderWithProviders(<BlogListPage />);
    expect(screen.getByRole('heading', { name: /blog/i, level: 1 })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders(<BlogListPage />);
    expect(screen.getByText(/recipes, tips, and stories/i)).toBeInTheDocument();
  });

  it('renders blog posts from the CMS API', () => {
    renderWithProviders(<BlogListPage />);
    for (const post of apiPosts) {
      expect(screen.getAllByText(post.title).length).toBeGreaterThan(0);
    }
  });

  it('renders blog post links', () => {
    renderWithProviders(<BlogListPage />);
    const links = screen.getAllByRole('link');
    const blogLinks = links.filter(l => l.getAttribute('href')?.startsWith('/blog/'));
    expect(blogLinks.length).toBeGreaterThan(0);
  });

  it('renders published dates', () => {
    renderWithProviders(<BlogListPage />);
    // Dates should be rendered in some format
    for (const post of apiPosts) {
      const dt = new Date(post.published_at);
      const expected = dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
      expect(screen.getByText(expected)).toBeInTheDocument();
    }
  });
});
