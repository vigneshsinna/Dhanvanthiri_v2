import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { usePageQuery } from '@/features/cms/api';
import { PageLoader } from '@/components/ui/Spinner';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export function AboutPage() {
  const { data, isLoading } = usePageQuery('about');
  const page = data?.data?.data;
  const pageHtml = page?.content ?? page?.body ?? '';

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
    <>
      <Helmet>
        <title>{page.meta_title || `${page.title} - Dhanvanthiri Foods`}</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
      </Helmet>

      <article className="mx-auto max-w-4xl">
        <h1
          className="text-3xl font-bold text-slate-900 sm:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {page.title}
        </h1>
        <div
          className="prose prose-slate mt-6 max-w-none prose-headings:font-semibold prose-a:text-brand-700 prose-p:my-5 prose-li:my-1.5 prose-img:my-8 prose-img:rounded-2xl prose-img:shadow-card"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageHtml) }}
        />
      </article>
    </>
  );
}
