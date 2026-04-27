import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { BlogPostPage } from './BlogPostPage';

const mockSlug = 'admin-blog-post';
const apiPost = {
  id: 1,
  title: 'Admin Blog Post',
  slug: mockSlug,
  excerpt: 'Managed by admin',
  body: '<p>Admin body content</p>',
  published_at: '2026-04-01T00:00:00.000Z',
};
const relatedPost = {
  id: 2,
  title: 'Related Admin Post',
  slug: 'related-admin-post',
  excerpt: 'Also managed by admin',
  body: '<p>Related body</p>',
  published_at: '2026-04-02T00:00:00.000Z',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: mockSlug }),
  };
});

vi.mock('@/features/cms/api', () => ({
  usePostQuery: () => ({
    data: { data: apiPost },
    isLoading: false,
    error: null,
  }),
  usePostsQuery: () => ({
    data: { data: [apiPost, relatedPost] },
    isLoading: false,
    error: null,
  }),
}));

describe('BlogPostPage', () => {
  it('renders CMS post title', () => {
    renderWithProviders(<BlogPostPage />);
    expect(screen.getByRole('heading', { name: apiPost.title })).toBeInTheDocument();
  });

  it('renders back to blog link', () => {
    renderWithProviders(<BlogPostPage />);
    expect(screen.getByText(/back to blog/i)).toBeInTheDocument();
  });

  it('renders post body content', () => {
    renderWithProviders(<BlogPostPage />);
    expect(screen.getByText(/admin body content/i)).toBeInTheDocument();
  });

  it('renders continue reading section with related posts', () => {
    renderWithProviders(<BlogPostPage />);
    expect(screen.getByRole('heading', { name: /continue reading/i })).toBeInTheDocument();
    expect(screen.getByText(relatedPost.title)).toBeInTheDocument();
  });
});
