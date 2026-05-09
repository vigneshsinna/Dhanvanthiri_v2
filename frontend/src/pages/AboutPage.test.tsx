import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, screen } from '@/test/test-utils';
import { server } from '@/test/msw-server';
import { AboutPage } from './AboutPage';

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AboutPage', () => {
  it('renders the admin-managed about page content with two images and description', async () => {
    server.use(
      http.get('/api/v2/pages/about', () => HttpResponse.json({
        success: true,
        data: {
          id: 10,
          slug: 'about',
          title: 'About Dhanvanthiri Foods',
          content: `
            <p><img src="/uploads/all/about/brand-story.png" alt="Admin brand story" /></p>
            <p>Admin controlled about description.</p>
            <p><img src="/uploads/all/about/mission-vision.png" alt="Admin mission vision" /></p>
          `,
          body: '',
          meta_title: 'About Us - Dhanvanthiri Foods',
          meta_description: 'Admin managed about meta description.',
        },
      }))
    );

    renderWithProviders(<AboutPage />);

    expect(await screen.findByRole('heading', { name: /about dhanvanthiri foods/i })).toBeInTheDocument();
    expect(screen.getByText(/admin controlled about description/i)).toBeInTheDocument();
    expect(screen.getByAltText(/admin brand story/i)).toHaveAttribute('src', '/uploads/all/about/brand-story.png');
    expect(screen.getByAltText(/admin mission vision/i)).toHaveAttribute('src', '/uploads/all/about/mission-vision.png');
  });

  it('renders configured message when the page is not found in API', async () => {
    server.use(
      http.get('/api/v2/pages/about', () => HttpResponse.json({
        success: false,
        data: null,
      }))
    );

    renderWithProviders(<AboutPage />);

    expect(await screen.findByRole('heading', { name: /about page not configured/i })).toBeInTheDocument();
    expect(screen.getByText(/add the about page content from admin pages/i)).toBeInTheDocument();
  });
});
