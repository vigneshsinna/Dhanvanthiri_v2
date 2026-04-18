import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cmsAdapter } from './cmsAdapter';
import { headlessApi } from './client';

vi.mock('./client', () => ({
  headlessApi: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(headlessApi.get);

describe('cmsAdapter', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads normalized storefront settings from the storefront settings endpoint', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          website: { name: 'Admin Store' },
          navigation: { primary: [] },
          social: { links: [] },
        },
      },
    } as any);

    const response = await cmsAdapter.websiteSettings();

    expect(mockedGet).toHaveBeenCalledWith('/storefront/settings');
    expect(response.data.website.name).toBe('Admin Store');
  });

  it('loads generic pages through the page-by-slug endpoint', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          title: 'About Our Store',
          content: '<p>Admin managed page</p>',
        },
      },
    } as any);

    const response = await cmsAdapter.page('about');

    expect(mockedGet).toHaveBeenCalledWith('/pages/about');
    expect(response.data.data.title).toBe('About Our Store');
  });

  it('normalizes blog list payloads from the V2 blogs collection shape', async () => {
    mockedGet.mockResolvedValue({
      data: {
        result: true,
        blogs: {
          data: [
            {
              id: 11,
              title: 'Traditional Pickle Making',
              slug: 'traditional-pickle-making',
              short_description: 'Old recipes, slow methods.',
              banner: '/uploads/blogs/pickle.png',
              category: 'Recipes',
              status: 1,
              created_at: '2026-04-10T12:00:00Z',
            },
          ],
          links: {},
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      },
    } as any);

    const response = await cmsAdapter.posts({ page: 1 });

    expect(mockedGet).toHaveBeenCalledWith('/blog-list', { params: { page: 1 } });
    expect(response.data.data).toEqual([
      expect.objectContaining({
        id: 11,
        title: 'Traditional Pickle Making',
        slug: 'traditional-pickle-making',
        excerpt: 'Old recipes, slow methods.',
        featured_image_url: '/uploads/blogs/pickle.png',
        category: { name: 'Recipes', slug: 'recipes' },
      }),
    ]);
    expect(response.data.meta).toEqual(expect.objectContaining({ current_page: 1, last_page: 1, total: 1 }));
  });

  it('normalizes blog detail payloads from the V2 blog shape', async () => {
    mockedGet.mockResolvedValue({
      data: {
        result: true,
        blog: {
          id: 15,
          title: 'Curry Leaves Health Benefits',
          slug: 'curry-leaves-health-benefits',
          short_description: 'A quick guide.',
          description: '<p>Long form content</p>',
          banner: '/uploads/blogs/curry.png',
          category: 'Health',
          meta_title: 'Meta Title',
          meta_description: 'Meta Description',
          created_at: '2026-04-11T09:00:00Z',
        },
      },
    } as any);

    const response = await cmsAdapter.post('curry-leaves-health-benefits');

    expect(mockedGet).toHaveBeenCalledWith('/blog-details/curry-leaves-health-benefits');
    expect(response.data).toEqual(expect.objectContaining({
      id: 15,
      title: 'Curry Leaves Health Benefits',
      slug: 'curry-leaves-health-benefits',
      excerpt: 'A quick guide.',
      body: '<p>Long form content</p>',
      featured_image_url: '/uploads/blogs/curry.png',
      category: { name: 'Health', slug: 'health' },
      meta_title: 'Meta Title',
      meta_description: 'Meta Description',
    }));
  });

  it('loads faqs from the dedicated faq collection endpoint', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [
          { id: 1, question: 'How long does shipping take?', answer: '3-5 days', category: 'Shipping' },
        ],
      },
    } as any);

    const response = await cmsAdapter.faqs();

    expect(mockedGet).toHaveBeenCalledWith('/faqs');
    expect(response.data.data).toEqual([
      expect.objectContaining({
        id: 1,
        question: 'How long does shipping take?',
        answer: '3-5 days',
        category: 'Shipping',
      }),
    ]);
  });
});
