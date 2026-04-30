import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProductsQuery, useCategoriesQuery } from '@/features/catalog/api';
import { useAddCartItemMutation } from '@/features/cart/api';
import {
  productsPageContent,
} from '@/features/catalog/data/productCatalogData';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';
import { getProductReviewSnapshot } from '@/features/catalog/lib/reviewsViewModel';
import { resolveProductImageUrl } from '@/lib/productImage';
import './CatalogPage.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  primary_image_url?: string;
  short_description?: string;
  avg_rating?: number;
  review_count?: number;
  variants?: { id: number; name?: string; stock_quantity: number }[];
  tags?: { name: string }[];
  category?: { id?: number; name: string; slug?: string };
  badge?: string;
  tamil_name?: string;
  average_rating?: number;
  reviews?: string;
  why_love?: string[];
  pair_with?: string;
  storage?: string;
  custom_labels?: string[] | Record<string, string>;
  is_premium?: boolean;
  video_link?: string[];
  brand?: {
    id: number;
    name: string;
    slug: string;
    logo: string;
  };
  est_shipping_time?: number;
  videos?: string[];
  wholesale?: {

  }[];
  current_stock?: number;
  unit?: string;
  rating?: number;
  rating_count?: number;
  earn_point?: number;
  description?: string;
  category_id?: number;
  choice_options?: {
    name: string;
    value: string;
  }[];
  colors?: string[];
  has_discount?: boolean;
  discount?: string;
  stroked_price?: string;
  main_price?: string;
  calculable_price?: number;
  currency_symbol?: string;
  shop_id?: number;
  shop_slug?: string;
  shop_name?: string;
  shop_logo?: string;
  added_by?: string;
  seller_id?: number

}

type CategoryFilter = string;
type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_sellers';

const SITE_URL = 'https://dhanvanthirifoods.in';
const PAGE = productsPageContent;

const stripHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTextList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(stripHtml).filter(Boolean);
  if (value && typeof value === 'object') return Object.values(value).map(stripHtml).filter(Boolean);
  return typeof value === 'string' ? value.split(/[\n,]/).map(stripHtml).filter(Boolean) : [];
};

function ProductCardImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="flex h-full w-full items-center justify-center text-5xl text-brand-700/30">🫙</div>;
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

const trustIcons: Record<string, string> = {
  'Small Batch Handmade': '🫙',
  'Preservative-Free': '🌿',
  'Pan-India Delivery': '📦',
  'Authentic Tamil Recipes': '🍛',
};

export function CatalogPage() {
  const currentLocale = getStorefrontLocale();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('search') ?? '').trim();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // API data (used when backend is available)
  const { data, isLoading: productsLoading } = useProductsQuery({ perPage: 100, search: searchTerm || undefined });
  const { data: catData } = useCategoriesQuery();
  const addToCart = useAddCartItemMutation();

  const apiProducts: Product[] = data?.data?.data ?? data?.data ?? [];
  const copy = {
    allProducts: getLocalizedText(currentLocale, { en: 'All Products', ta: 'அனைத்து தயாரிப்புகள்' }),
    sortBy: getLocalizedText(currentLocale, { en: 'Sort by:', ta: 'வரிசைப்படுத்த:' }),
    newest: getLocalizedText(currentLocale, { en: 'Newest First', ta: 'புதியவை முதலில்' }),
    lowToHigh: getLocalizedText(currentLocale, { en: 'Price: Low to High', ta: 'விலை: குறைவிலிருந்து உயர்வு' }),
    highToLow: getLocalizedText(currentLocale, { en: 'Price: High to Low', ta: 'விலை: உயர்விலிருந்து குறைவு' }),
    bestSellers: getLocalizedText(currentLocale, { en: 'Best Sellers', ta: 'சிறந்த விற்பனைகள்' }),
    clearFilters: getLocalizedText(currentLocale, { en: 'Clear Filters', ta: 'வடிகட்டலை நீக்கு' }),
    addToCart: getLocalizedText(currentLocale, { en: 'Add to Cart', ta: 'கார்டில் சேர்' }),
    soldOut: getLocalizedText(currentLocale, { en: 'Sold Out', ta: 'விற்றுத் தீர்ந்தது' }),
    whyChoose: getLocalizedText(currentLocale, { en: 'Why Choose Dhanvanthiri Foods', ta: 'ஏன் Dhanvanthiri Foods தேர்வு செய்ய வேண்டும்' }),
    faq: getLocalizedText(currentLocale, { en: 'Frequently Asked Questions', ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்' }),
  };

  const mergedProducts = useMemo(() => apiProducts, [apiProducts]);
  const apiCategories = useMemo(() => {
    const raw = catData?.data?.data ?? catData?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [catData]);
  const categoryFilters = useMemo(() => {
    const names = new Set<string>();
    apiCategories.forEach((category: any) => {
      if (category?.name) names.add(String(category.name));
    });
    mergedProducts.forEach((product) => {
      if (product.category?.name) names.add(product.category.name);
      product.tags?.forEach((tag) => {
        if (tag.name) names.add(tag.name);
      });
    });
    return ['all', ...Array.from(names)];
  }, [apiCategories, mergedProducts]);

  // Filter by category
  const filteredProducts = useMemo(() => {
    let products = mergedProducts;

    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      products = products.filter((p) => {
        const haystack = [
          p.name,
          p.slug,
          p.short_description,
          p.description,
          p.tamil_name,
          p.category?.name,
          ...(p.tags?.map((t) => t.name) ?? []),
        ].filter(Boolean).join(' ').toLowerCase();

        return haystack.includes(needle);
      });
    }

    if (activeCategory !== 'all') {
      products = products.filter((p) => {
        if (p.category?.name) return p.category.name.toLowerCase() === activeCategory.toLowerCase();
        return p.tags?.some((t) => t.name.toLowerCase() === activeCategory.toLowerCase());
      });
    }

    // Sort
    const sorted = [...products];
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'best_sellers':
        sorted.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [mergedProducts, activeCategory, sortBy, searchTerm]);

  const handleAddToCart = (product: Product) => {
    addToCart.mutate({ product_id: product.id, quantity: 1 });
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mergedProducts.length };
    categoryFilters.slice(1).forEach((category) => {
      counts[category] = 0;
    });
    mergedProducts.forEach((p) => {
      if (p.category?.name && counts[p.category.name] !== undefined) {
        counts[p.category.name]++;
      } else if (p.tags) {
        p.tags.forEach((t) => {
          if (counts[t.name] !== undefined) counts[t.name]++;
        });
      }
    });
    return counts;
  }, [categoryFilters, mergedProducts]);

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE.seo_title,
    description: PAGE.seo_description,
    url: `${SITE_URL}/products`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: filteredProducts.length,
      itemListElement: filteredProducts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          url: `${SITE_URL}/products/${p.slug}`,
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
          },
        },
      })),
    },
  }), [filteredProducts]);

  return (
    <>
      <Helmet>
        <title>{PAGE.seo_title}</title>
        <meta name="description" content={PAGE.seo_description} />
        <link rel="canonical" href={`${SITE_URL}/products`} />
        <meta property="og:title" content={PAGE.seo_title} />
        <meta property="og:description" content={PAGE.seo_description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/products`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ─── HERO ─── */}
      <header className="catalog-hero hero-gradient-bg">
        <div className="catalog-hero-orb catalog-hero-orb--one float-up" aria-hidden="true" />
        <div className="catalog-hero-orb catalog-hero-orb--two float-diag" aria-hidden="true" />
        <div className="catalog-hero-overlay" />
        <div className="catalog-container catalog-hero-inner">
          <span className="catalog-eyebrow animate-on-scroll top-down">{PAGE.hero_eyebrow}</span>
          <h1 className="catalog-hero-title animate-on-scroll top-down" data-animate-delay="90ms">{PAGE.hero_title}</h1>
          <p className="catalog-hero-subtitle animate-on-scroll top-down" data-animate-delay="150ms">{PAGE.hero_subtitle}</p>
          <div className="catalog-trust-row animate-on-scroll top-down" data-animate-delay="220ms">
            {PAGE.trust_points.map((point) => (
              <span key={point} className="catalog-trust-point">
                <span className="catalog-trust-icon">{trustIcons[point] || '✓'}</span>
                {point}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ─── INTRO ─── */}
      <section className="catalog-section">
        <div className="catalog-container">
          <p className="catalog-intro-text animate-on-scroll top-down">{PAGE.intro}</p>
        </div>
      </section>

      {/* ─── FILTERS BAR ─── */}
      <section className="catalog-section catalog-filters-section">
        <div className="catalog-container">
          <div className="catalog-filters-bar animate-on-scroll top-down">
            <div className="catalog-category-tabs">
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  className={`catalog-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? copy.allProducts : cat}
                  <span className="catalog-tab-count">{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
            <div className="catalog-sort">
              <label htmlFor="sort-select" className="catalog-sort-label">{copy.sortBy}</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="catalog-sort-select"
              >
                <option value="newest">{copy.newest}</option>
                <option value="price_asc">{copy.lowToHigh}</option>
                <option value="price_desc">{copy.highToLow}</option>
                <option value="best_sellers">{copy.bestSellers}</option>
              </select>
            </div>
          </div>

          {/* Category description */}
          {searchTerm && (
            <p className="catalog-category-desc" role="status">
              Search results for "{searchTerm}"
            </p>
          )}
        </div>
      </section>

      {/* ─── PRODUCT GRID ─── */}
      <section className="catalog-section">
        <div className="catalog-container">
          {filteredProducts.length === 0 ? (
            <div className="catalog-empty">
              <div className="catalog-empty-icon">{productsLoading ? '...' : '🔍'}</div>
              <p className="catalog-empty-text">
                {productsLoading
                  ? 'Loading products...'
                  : searchTerm ? `No products found for "${searchTerm}".` : PAGE.empty_state}
              </p>
              {!productsLoading && (
                <button
                  className="catalog-empty-btn"
                  onClick={() => { setActiveCategory('all'); setSortBy('newest'); }}
                >
                  {copy.clearFilters}
                </button>
              )}
            </div>
          ) : (
            <div className="catalog-grid stagger-children">
              {filteredProducts.map((product) => {
                const inStock = product.variants?.some((v) => v.stock_quantity > 0) ?? true;
                const imageUrl = resolveProductImageUrl({
                  primaryImageUrl: product.primary_image_url,
                  productName: product.name,
                  productSlug: product.slug,
                  productId: product.id || 1,
                });
                const badge = product.badge || '';
                const category = product.category?.name || product.tags?.[0]?.name || '';
                const desc = stripHtml(product.short_description || product.description || '');
                const labels = toTextList(product.custom_labels);
                const chips = labels.slice(0, 3);
                const weight = product.variants?.[0]?.name || product.unit || '';
                const tamilTitle = product.tamil_name || '';
                const pairWith = toTextList(product.pair_with).join(' / ') || stripHtml(product.pair_with);
                const reviewSnapshot = getProductReviewSnapshot(product);

                return (
                  <article key={product.id} className="catalog-card group animate-on-scroll scale-in" data-testid="storefront-product-card">
                    <Link to={`/products/${product.slug}`} className="block">
                      <div className="catalog-card-img">
                        <ProductCardImage src={imageUrl} alt={product.name} />
                        {badge && <div className="catalog-card-badge">{badge}</div>}
                      </div>
                    </Link>
                    <div className="catalog-card-body">
                      {category && <div className="catalog-card-category">{category.toUpperCase()}</div>}
                      <Link to={`/products/${product.slug}`} className="block">
                        <h3 className="catalog-card-title group-hover:text-brand-700 transition-colors">
                          {product.name}
                        </h3>
                        {tamilTitle && <div className="text-sm font-medium text-brand-700/80 mb-2">{tamilTitle}</div>}
                      </Link>
                      {desc && <p className="catalog-card-desc mt-1">{desc}</p>}
                      {chips.length > 0 && (
                        <div className="catalog-card-chips">
                          {chips.map((chip, i) => (
                            <span key={i} className="catalog-chip">{chip}</span>
                          ))}
                        </div>
                      )}
                      {pairWith && <div className="catalog-card-pairing">Best with: {pairWith}</div>}
                      <div className="catalog-card-price-row">
                        <div className="catalog-card-price-left">
                          <span className="catalog-price">₹{product.price}</span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="catalog-price-old">₹{product.compare_at_price}</span>
                          )}
                        </div>
                        <span className="catalog-weight">{weight}</span>
                      </div>
                      {(reviewSnapshot.averageRating != null && reviewSnapshot.averageRating > 0) && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1">
                          <span className="text-amber-500 text-sm leading-none">{'★'.repeat(Math.round(reviewSnapshot.averageRating))}{'☆'.repeat(5 - Math.round(reviewSnapshot.averageRating))}</span>
                          {reviewSnapshot.reviewCount > 0 && (
                            <span className="text-xs text-slate-500">({reviewSnapshot.reviewCount})</span>
                          )}
                        </div>
                      )}
                      <div className="catalog-card-cta">
                        {inStock ? (
                          <button
                            className="catalog-btn-cart"
                            data-testid="storefront-add-to-cart"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                          >
                            {copy.addToCart}
                          </button>
                        ) : (
                          <button className="catalog-btn-cart catalog-btn-sold-out" disabled>
                            {copy.soldOut}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="catalog-section catalog-why-section">
        <div className="catalog-container">
          <div className="catalog-section-head">
            <h2>{copy.whyChoose}</h2>
          </div>
          <div className="catalog-why-grid stagger-children">
            {[
              { title: 'Authentic Tamil Flavours', desc: 'Inspired by time-honoured recipes that feel like home.', icon: '🍛' },
              { title: 'Small Batch Handmade', desc: 'Prepared in small batches for freshness, consistency, and care.', icon: '🫙' },
              { title: 'Everyday Meal Companions', desc: 'Made to pair effortlessly with rice, idli, dosa, chapati, and tiffin.', icon: '🍚' },
              { title: 'Pan-India Delivery', desc: 'Packed hygienically and delivered across India.', icon: '📦' },
            ].map((item, i) => (
              <div key={i} className="catalog-why-card animate-on-scroll scale-in">
                <div className="catalog-why-icon">{item.icon}</div>
                <h3 className="catalog-why-title">{item.title}</h3>
                <p className="catalog-why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="catalog-section">
        <div className="catalog-container catalog-faq-container">
          <div className="catalog-section-head">
            <h2>{copy.faq}</h2>
          </div>
          <div className="catalog-faq-list">
            {PAGE.faqs.map((faq, i) => (
              <div
                key={i}
                className={`catalog-faq-item animate-on-scroll top-down ${openFaq === i ? 'open' : ''}`}
              >
                <button
                  className="catalog-faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`catalog-faq-chevron ${openFaq === i ? 'rotated' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="catalog-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEO CONTENT ─── */}
      <section className="catalog-section catalog-seo-section">
        <div className="catalog-container">
          <p className="catalog-seo-text">
            Looking for <strong>traditional Tamil foods online</strong>? Our collection includes flavourful{' '}
            <strong>Tamil pickles</strong>, <strong>homestyle thokku</strong>, and <strong>authentic podi varieties</strong>{' '}
            made for modern kitchens without losing the essence of traditional taste. From{' '}
            <strong>Maanga Oorugai</strong> and <strong>Lime Pickle</strong> to <strong>Karuveppilai Thokku</strong>,{' '}
            <strong>Pirandai Thokku</strong>, <strong>Paruppu Podi</strong>, and <strong>Kollu Podi</strong>, our range is
            crafted for everyday enjoyment and convenient online ordering across India.
          </p>
        </div>
      </section>
    </>
  );
}
