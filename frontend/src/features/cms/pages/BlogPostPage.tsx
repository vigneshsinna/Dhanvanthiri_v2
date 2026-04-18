import { useParams, Link } from 'react-router-dom';
import { usePostQuery, usePostsQuery } from '@/features/cms/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Helmet } from 'react-helmet-async';
import { fallbackBlogPosts } from '@/lib/fallbackData';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string | null;
  category?: { name: string; slug: string };
  author?: { name: string };
  reading_time?: number;
  published_at: string;
  meta_title?: string;
  meta_description?: string;
  body: string;
  tags?: { name: string }[];
}

function normalizePostsResponse(data: unknown): BlogPost[] {
  if (!data || typeof data !== 'object') return [];

  const root = data as {
    data?: BlogPost[] | { data?: BlogPost[] };
  };

  if (Array.isArray(root.data)) {
    return root.data;
  }

  if (root.data && typeof root.data === 'object' && Array.isArray(root.data.data)) {
    return root.data.data;
  }

  return [];
}

function normalizeArticleHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sectionHeadingPattern = /^[A-Z][A-Za-z0-9&,'()\-\s]{2,80}$/;

  Array.from(doc.body.querySelectorAll('p')).forEach((paragraph) => {
    const text = paragraph.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const onlyInlineChildren = Array.from(paragraph.children).every((child) =>
      ['STRONG', 'EM', 'SPAN', 'B', 'I'].includes(child.tagName),
    );
    const looksLikeStandaloneLabel =
      text.length > 0 &&
      text.length <= 80 &&
      !/[.!?;:]$/.test(text) &&
      sectionHeadingPattern.test(text) &&
      onlyInlineChildren;

    if (looksLikeStandaloneLabel) {
      const heading = doc.createElement(text.split(' ').length <= 4 ? 'h2' : 'h3');
      heading.textContent = text;
      paragraph.replaceWith(heading);
      return;
    }

    if (!text && paragraph.children.length === 0) {
      paragraph.remove();
    }
  });

  const firstParagraph = doc.body.querySelector('p');
  if (firstParagraph) {
    firstParagraph.setAttribute('data-lead', 'true');
  }

  Array.from(doc.body.querySelectorAll('a')).forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noreferrer noopener');
    }
  });

  return doc.body.innerHTML;
}

function getRelatedPosts(currentPost: BlogPost, posts: BlogPost[]): BlogPost[] {
  const uniquePosts = posts.filter(
    (post, index, collection) =>
      post.slug !== currentPost.slug && collection.findIndex((candidate) => candidate.slug === post.slug) === index,
  );

  const sameCategory = uniquePosts.filter(
    (post) => post.category?.slug && post.category.slug === currentPost.category?.slug,
  );
  const remaining = uniquePosts.filter(
    (post) => !sameCategory.some((candidate) => candidate.slug === post.slug),
  );

  return [...sameCategory, ...remaining].slice(0, 3);
}

export function BlogPostPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const { slug } = useParams();
  const { data, isLoading, error } = usePostQuery(slug || '');
  const { data: postsData } = usePostsQuery({ per_page: 6 });
  let post = data?.data as BlogPost | undefined;

  if (isLoading) return <PageLoader />;

  if (error || !post) {
    post = (fallbackBlogPosts as BlogPost[]).find((entry) => entry.slug === slug);
  }

  if (!post) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">Post Not Found</h1>
        <Link to="/blog" className="mt-4 inline-block text-brand-700 hover:underline">{t('Back to Blog', 'வலைப்பதிவுக்கு திரும்பு')}</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} - Dhanvanthiri Foods</title>
        {post.meta_description && <meta name="description" content={post.meta_description} />}
      </Helmet>

      <article className="blog-post-shell">
        <div className="blog-post-ornament" aria-hidden="true" />

        <div className="mx-auto max-w-[1120px]">
          <Link to="/blog" className="blog-post-back-link">← {t('Back to Blog', 'வலைப்பதிவுக்கு திரும்பு')}</Link>

          {post.featured_image_url && (
            <div className="blog-post-hero-frame">
              <div className="blog-post-hero aspect-[16/8.6] overflow-hidden rounded-[28px]">
                <img src={post.featured_image_url} alt={post.title} className="h-full w-full object-cover" />
              </div>
            </div>
          )}

          <header className="blog-post-header">
            {post.category && <span className="blog-post-kicker">{post.category.name}</span>}
            <h1 className="blog-post-title">{post.title}</h1>

            <div className="blog-post-meta-row">
              {post.author && (
                <span className="blog-post-author-pill">
                  <span className="blog-post-author-avatar">{post.author.name.charAt(0)}</span>
                  <span>{post.author.name}</span>
                </span>
              )}
              <span>{new Date(post.published_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {post.reading_time && (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.reading_time} min read
                </span>
              )}
            </div>

            {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}

            {post.tags && post.tags.length > 0 && (
              <div className="blog-post-tags">
                {post.tags.map((tag) => (
                  <span key={tag.name} className="blog-post-tag">{tag.name}</span>
                ))}
              </div>
            )}
          </header>

          <div className="blog-post-reading-column">
            <div className="blog-post-body-card">
              <div
                className="blog-post-prose"
                dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(post.body) }}
              />
            </div>
          </div>

          {getRelatedPosts(post, normalizePostsResponse(postsData).length > 0 ? normalizePostsResponse(postsData) : (fallbackBlogPosts as BlogPost[])).length > 0 && (
            <section className="blog-post-related-section" aria-labelledby="continue-reading-title">
              <div className="blog-post-related-intro">
                <span className="blog-post-kicker">From Our Journal</span>
                <h2 id="continue-reading-title" className="blog-post-related-title">Continue Reading</h2>
                <p className="blog-post-related-copy">
                  More stories from the Dhanvanthiri kitchen on tradition, ingredients, and everyday food rituals.
                </p>
              </div>

              <div className="blog-post-related-grid">
                {getRelatedPosts(post, normalizePostsResponse(postsData).length > 0 ? normalizePostsResponse(postsData) : (fallbackBlogPosts as BlogPost[])).map((relatedPost) => (
                  <article key={relatedPost.slug} className="blog-post-related-card">
                    <Link to={`/blog/${relatedPost.slug}`} className="block">
                      <div className="blog-post-related-media aspect-[16/10] overflow-hidden rounded-[22px] bg-[#EDE4D7]">
                        {relatedPost.featured_image_url ? (
                          <img src={relatedPost.featured_image_url} alt={relatedPost.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                        ) : null}
                      </div>
                    </Link>
                    <div className="mt-5">
                      {relatedPost.category && <span className="blog-post-related-kicker">{relatedPost.category.name}</span>}
                      <Link to={`/blog/${relatedPost.slug}`}>
                        <h3 className="blog-post-related-card-title">{relatedPost.title}</h3>
                      </Link>
                      {relatedPost.excerpt && <p className="blog-post-related-excerpt">{relatedPost.excerpt}</p>}
                      <div className="blog-post-related-meta">
                        <span>{new Date(relatedPost.published_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {relatedPost.reading_time && <span>{relatedPost.reading_time} min read</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
