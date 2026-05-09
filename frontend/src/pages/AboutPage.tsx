import { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { usePageQuery } from '@/features/cms/api';
import { PageLoader } from '@/components/ui/Spinner';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { Button } from '@/components/ui/Button';
import { usePageScrollReveal } from '@/lib/utils/usePageScrollReveal';
import { ChevronRight, Leaf, Sparkles, Trophy } from 'lucide-react';

export function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { data, isLoading } = usePageQuery('about');
  const page = data?.data?.data;
  const pageHtml = page?.content ?? page?.body ?? '';

  usePageScrollReveal(containerRef, `${location.pathname}${location.search}`);

  if (isLoading) return <PageLoader />;

  if (!page || !pageHtml) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
        <h1 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          About Page Not Configured
        </h1>
        <p className="mt-3 text-slate-600">
          Add the About page content from Admin Pages using the slug <span className="font-mono">about</span>.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="stagger-children">
      <Helmet>
        <title>{page.meta_title || `${page.title} - Dhanvanthiri Foods`}</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
      </Helmet>

      {/* Hero Section */}
      <section className="relative -mt-8 mb-16 overflow-hidden bg-brand-900 lg:-mt-12" data-reveal-ignore>
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/images/about/hero.png"
            alt="Dhanvanthiri Foods Hero"
            className="h-full w-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/20 via-transparent to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-36">
          <h1
            className="text-balance text-4xl font-bold tracking-tight text-white sm:text-6xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {page.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
            Preserving the authentic taste of South Indian traditions, one jar at a time.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          {/* Main CMS Content */}
          <article className="lg:col-span-8">
            <div
              className="legal-richtext"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageHtml) }}
            />
          </article>

          {/* Sticky Sidebar */}
          <aside className="space-y-8 lg:col-span-4 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
              <img
                src="/assets/images/about/tradition.png"
                alt="Traditional spice grinding"
                className="h-64 w-full rounded-2xl object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  The Ammi Kallu Way
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  We still use traditional stone grinders for our spice blends, ensuring that the natural oils and aromas are preserved for that authentic 'homemade' taste.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-brand-50 p-8 border border-brand-100">
              <h3 className="text-lg font-semibold text-brand-900">Our Brand Pillars</h3>
              <ul className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">100% Natural</p>
                    <p className="text-xs text-slate-600">No preservatives or artificial colors.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Pure Cold-Pressed Oils</p>
                    <p className="text-xs text-slate-600">Authentic wood-pressed sesame oil.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Handcrafted</p>
                    <p className="text-xs text-slate-600">Made in small batches for quality.</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Featured Brand Banner */}
        <section className="my-24 overflow-hidden rounded-[3rem] bg-slate-900 shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="p-12 lg:p-20">
              <h2 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Rooted in Purity
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-300 text-balance">
                Every ingredient is hand-picked from local farms. We don't believe in shortcuts — only the slow, patient path to perfection that has been passed down through generations.
              </p>
              <div className="mt-10">
                <Link to="/products">
                  <Button className="group gap-2 rounded-full px-8 py-6 text-lg">
                    Explore Our Products
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 lg:h-auto">
              <img
                src="/assets/images/about/purity.png"
                alt="Pure ingredients"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent lg:from-slate-900" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
