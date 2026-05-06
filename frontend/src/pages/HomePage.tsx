import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useFeaturedProductsQuery } from '@/features/catalog/api';
import { unwrapCmsCollection, useBannersQuery } from '@/features/cms/api';
import { useAddCartItemMutation } from '@/features/cart/api';
import { resolveProductImageUrl } from '@/lib/productImage';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';
import { getProductReviewSnapshot } from '@/features/catalog/lib/reviewsViewModel';
import './HomePage.css';

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
  brand?: { name: string };
  custom_labels?: Record<string, string>;
  variants?: { id: number; name?: string; stock_quantity: number }[];
}

const SITE_URL = "https://dhanvanthirifoods.in";
const BRAND = "Dhanvanthiri Foods";

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

// Per-product metadata for rich cards
const productMeta: Record<string, { category?: string; desc?: string; chips?: string[]; pairing?: string; badge?: string }> = {
  'karuveppilai-thokku': { category: 'THOKKU', desc: 'Aromatic curry leaf thokku with deep roasted traditional taste.', chips: ['Herby', 'Best with rice'], pairing: 'Hot rice & ghee', badge: 'Customer Favourite' },
  'chinavangayam-thokku': { category: 'THOKKU', desc: 'Sweet-spicy small onion thokku with rich homestyle flavour.', chips: ['Savory', 'Best with dosa'], pairing: 'Idli / dosa', badge: 'Homemade' },
  'pavakai-thokku': { category: 'THOKKU', desc: 'Bold bitter gourd thokku balanced with spice and tang.', chips: ['Bold', 'Traditional'], pairing: 'Hot rice', badge: 'Traditional' },
  'vallarai-thokku': { category: 'THOKKU', desc: 'Nutritious vallarai thokku with earthy and comforting flavour.', chips: ['Herbal', 'Wellness-inspired'], pairing: 'Curd rice', badge: '' },
  'valaipoo-thokku': { category: 'THOKKU', desc: 'Banana flower thokku made with authentic Tamil home-style seasoning.', chips: ['Earthy', 'Homestyle'], pairing: 'Hot rice & ghee', badge: '' },
  'kovakkai-thokku': { category: 'THOKKU', desc: 'Tasty ivy gourd thokku with a mildly spiced, rustic finish.', chips: ['Mild Spice', 'Best with rice'], pairing: 'Hot rice', badge: '' },
  'poondu-thokku': { category: 'THOKKU', desc: 'Garlic-forward thokku with punchy flavour and rich spice notes.', chips: ['Bold', 'Garlicky'], pairing: 'Curd rice / dosa', badge: 'Customer Favourite' },
  'mallithalai-thokku': { category: 'THOKKU', desc: 'Fresh coriander thokku with vibrant aroma and a tangy touch.', chips: ['Fresh', 'Herby'], pairing: 'Hot rice', badge: '' },
  'pirandai-thokku': { category: 'THOKKU', desc: 'Traditional pirandai thokku with distinctive flavour and homestyle depth.', chips: ['Traditional', 'Unique Taste'], pairing: 'Hot rice & ghee', badge: '' },
  'thakkali-thokku': { category: 'THOKKU', desc: 'Classic tomato thokku with tangy, spicy everyday comfort flavour.', chips: ['Tangy', 'Daily Favourite'], pairing: 'Idli / dosa', badge: 'Everyday Essential' },
  'maangai-urukai': { category: 'URUKAI', desc: 'Classic mango pickle with bold spice and irresistible tanginess.', chips: ['Tangy', 'Authentic'], pairing: 'Curd rice / dosa', badge: 'Best Seller' },
  'narthangai-urukai': { category: 'URUKAI', desc: 'Traditional citron pickle with sharp citrus flavour and spicy depth.', chips: ['Citrusy', 'Authentic'], pairing: 'Hot rice', badge: 'Traditional' },
  'lemon-urukai': { category: 'URUKAI', desc: 'Zesty lemon pickle matured for rich taste and homestyle punch.', chips: ['Zingy', 'Best with curd rice'], pairing: 'Curd rice', badge: '' },
  'ellu-podi': { category: 'PODI', desc: 'Roasted sesame podi with nutty aroma and rich traditional taste.', chips: ['Nutty', 'Best with idli'], pairing: 'Idli / dosa', badge: '' },
  'karuveppilai-podi': { category: 'PODI', desc: 'Curry leaf podi with earthy flavour and comforting aroma.', chips: ['Herby', 'Best with rice'], pairing: 'Hot rice & ghee', badge: 'Customer Favourite' },
  'kollu-podi': { category: 'PODI', desc: 'Horse gram podi with robust flavour and everyday wellness value.', chips: ['Protein-rich', 'Rustic'], pairing: 'Hot rice', badge: '' },
  'murungai-podi': { category: 'PODI', desc: 'Moringa podi packed with flavour and traditional goodness.', chips: ['Leafy', 'Nutritious'], pairing: 'Hot rice & ghee', badge: 'New' },
  'nilakadalai-podi': { category: 'PODI', desc: 'Peanut podi with rich nutty flavour and mild spice.', chips: ['Nutty', 'Kids Friendly'], pairing: 'Idli / dosa', badge: 'Customer Favourite' },
  'paruppu-podi': { category: 'PODI', desc: 'Classic lentil podi with simple, comforting South Indian flavour.', chips: ['Classic', 'Best Seller'], pairing: 'Hot rice & ghee', badge: 'Everyday Essential' },
  'pirandai-podi': { category: 'PODI', desc: 'Traditional pirandai podi with distinctive taste and homestyle character.', chips: ['Traditional', 'Unique'], pairing: 'Hot rice', badge: '' },
  'vallarai-podi': { category: 'PODI', desc: 'Brain-boosting brahmi leaf podi with earthy, herbal taste.', chips: ['Herbal', 'Wellness'], pairing: 'Hot rice & ghee', badge: '' },
  'poondu-podi': { category: 'PODI', desc: 'Flavorful garlic spice mix with punchy aroma.', chips: ['Bold', 'Garlicky'], pairing: 'Idli / dosa', badge: '' },
};

export function HomePage() {
  const currentLocale = getStorefrontLocale();
  const {
    data: featuredData,
    isLoading: featuredLoading,
  } = useFeaturedProductsQuery();
  const { data: bannerData } = useBannersQuery('home_hero');
  const addToCart = useAddCartItemMutation();
  const [cartFeedback, setCartFeedback] = useState<{ productId: number; status: 'adding' | 'added' | 'error' } | null>(null);

  const apiFeatured: Product[] = featuredData?.data?.data ?? featuredData?.data ?? [];
  const banners = unwrapCmsCollection<any>(bannerData);
  const heroBanner = banners.find((b: any) => b.is_active) ?? null;

  // Resolve banner image URL (relative paths need API base prefix)
  const resolveBannerImage = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (import.meta as any).env.VITE_API_BASE_URL?.replace('/api', '') || '';
    return `${base}${url}`;
  };

  const featured: Product[] = apiFeatured.slice(0, 8);
  const showProductSkeletons = featuredLoading && featured.length === 0;
  const copy = {
    heroPill: getLocalizedText(currentLocale, {
      en: '100% Natural • Preservative-Free',
      ta: '100% இயற்கை • பாதுகாப்புச் சேர்வுகள் இல்லை',
    }),
    heroTitle: getLocalizedText(currentLocale, {
      en: 'Traditional Tamil Pickles, Thokku & Podi — Handmade in Small Batches',
      ta: 'பாரம்பரிய தமிழ் ஊறுகாய், தொக்கு மற்றும் பொடி — சிறிய தொகுதிகளில் கைமுறையில் தயாரிப்பு',
    }),
    heroSub: getLocalizedText(currentLocale, {
      en: 'Sun-cured, slow-cooked and packed with authentic South Indian flavour. Delivered pan-India.',
      ta: 'சூரிய ஒளியில் உலர்த்தி, மெதுவாக சமைத்து, உண்மையான தென்னிந்திய சுவையுடன் இந்தியா முழுவதும் அனுப்பப்படுகிறது.',
    }),
    shopPickles: getLocalizedText(currentLocale, { en: 'Shop Pickles', ta: 'ஊறுகாய் வாங்க' }),
    shopThokku: getLocalizedText(currentLocale, { en: 'Shop Thokku', ta: 'தொக்கு வாங்க' }),
    shopPodi: getLocalizedText(currentLocale, { en: 'Shop Podi →', ta: 'பொடி வாங்க →' }),
    freeShipping: getLocalizedText(currentLocale, { en: '🚚 Free shipping above ₹499', ta: '🚚 ₹499க்கு மேல் இலவச டெலிவரி' }),
    hygienicPacking: getLocalizedText(currentLocale, { en: '🫙 Hygienic packing', ta: '🫙 சுத்தமான தொகுப்பு' }),
    familyRecipes: getLocalizedText(currentLocale, { en: '❤️ Family recipes', ta: '❤️ குடும்ப சமையல் மரபு' }),
    bestSellersTitle: getLocalizedText(currentLocale, {
      en: 'Best Selling Traditional Tamil Foods',
      ta: 'மிகவும் விரும்பப்படும் பாரம்பரிய தமிழ் உணவுகள்',
    }),
    bestSellersSubtitle: getLocalizedText(currentLocale, {
      en: 'Our most-loved pickles, thokku and podi — straight from our kitchen to yours.',
      ta: 'எங்கள் சமையலறையிலிருந்து உங்கள் வீட்டிற்கு வரும் மிகவும் விரும்பப்படும் ஊறுகாய், தொக்கு மற்றும் பொடி.',
    }),
    viewAllProducts: getLocalizedText(currentLocale, { en: 'View All Products →', ta: 'அனைத்து தயாரிப்புகளும் →' }),
    whyChooseTitle: getLocalizedText(currentLocale, {
      en: 'Why Choose Dhanvanthiri Foods',
      ta: 'ஏன் Dhanvanthiri Foods தேர்வு செய்ய வேண்டும்',
    }),
    whyChooseSubtitle: getLocalizedText(currentLocale, {
      en: 'Traditional Tamil flavours made with care, purity and authenticity.',
      ta: 'அக்கறை, தூய்மை மற்றும் உண்மைத்தன்மையுடன் தயாரிக்கப்படும் பாரம்பரிய தமிழ் சுவைகள்.',
    }),
    addToCart: getLocalizedText(currentLocale, { en: 'Add to Cart', ta: 'கார்டில் சேர்' }),
    addingToCart: getLocalizedText(currentLocale, { en: 'Adding...', ta: 'சேர்க்கிறது...' }),
    addedToCart: getLocalizedText(currentLocale, { en: 'Added', ta: 'சேர்க்கப்பட்டது' }),
    soldOut: getLocalizedText(currentLocale, { en: 'Sold Out', ta: 'விற்றுத் தீர்ந்தது' }),
  };

  const handleAddToCart = (product: Product) => {
    setCartFeedback({ productId: product.id, status: 'adding' });
    addToCart.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setCartFeedback({ productId: product.id, status: 'added' });
          window.dispatchEvent(new CustomEvent('dhanvanthiri:cart-added'));
        },
        onError: () => setCartFeedback({ productId: product.id, status: 'error' }),
      },
    );
  };

  useEffect(() => {
    if (!cartFeedback || cartFeedback.status === 'adding') return;
    const timeout = window.setTimeout(() => setCartFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [cartFeedback]);

  const meta = {
    title: "Traditional Tamil Foods | Pickles, Thokku & Podi (Pan-India Delivery)",
    description:
      "Shop authentic traditional Tamil pickles (oorugai), thokku and podi—handmade in small batches, preservative-free, and delivered pan-India. Taste the flavour of home.",
    canonical: `${SITE_URL}/`,
    ogImage: `${SITE_URL}/assets/og/home-hero.jpg`,
  };

  const jsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      name: BRAND,
      url: SITE_URL,
      image: [meta.ogImage],
      servesCuisine: ["South Indian", "Tamil"],
      areaServed: "IN",
      sameAs: [],
    };
  }, [meta.ogImage]);

  const jsonLdWebsite = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/products?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:image" content={meta.ogImage} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.ogImage} />

        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(jsonLdWebsite)}</script>
      </Helmet>

      {/* HERO */}
      <header className="home-hero hero-gradient-bg" data-testid="storefront-home-hero">
        <div className="heroFloatOrb heroFloatOrb--one float-up" aria-hidden="true" />
        <div className="heroFloatOrb heroFloatOrb--two float-diag" aria-hidden="true" />
        <div className="heroOverlay" />
        <div className="home-container heroInner">
          <div className="heroCard animate-on-scroll fade-up">
            <div className="pill animate-on-scroll fade-up" data-animate-delay="0ms">{copy.heroPill}</div>
            <h1 className="heroTitle animate-on-scroll fade-up" data-animate-delay="80ms">
              {copy.heroTitle}
            </h1>
            <p className="heroSub animate-on-scroll fade-up" data-animate-delay="160ms">
              {copy.heroSub}
            </p>

            <div className="heroCtas animate-on-scroll fade-up" data-animate-delay="240ms">
              <Link className="btnPrimary" to="/products?category=pickle">
                {copy.shopPickles}
              </Link>
              <Link className="btnSecondary" to="/products?category=thokku">
                {copy.shopThokku}
              </Link>
              <Link className="btnLink" to="/products?category=podi">
                {copy.shopPodi}
              </Link>
            </div>

            <div className="trustRow animate-on-scroll fade-up" data-animate-delay="320ms">
              <span>{copy.freeShipping}</span>
              <span>{copy.hygienicPacking}</span>
              <span>{copy.familyRecipes}</span>
            </div>
          </div>

          <div className="heroVisual animate-on-scroll fade-up" data-animate-delay="200ms" aria-hidden="true" data-testid="storefront-home-banner">
            {heroBanner ? (
              <a href={heroBanner.cta_url || heroBanner.link_url || '/products'}>
                <img
                  src={resolveBannerImage(heroBanner.image || heroBanner.image_url)}
                  alt={heroBanner.title || 'Banner'}
                  loading="eager"
                />
              </a>
            ) : (
              <img
                src="/images/hero-pickles.png"
                alt="Traditional Tamil Pickles and Thokku"
                loading="eager"
              />
            )}
          </div>
        </div>
      </header>

      {/* BEST SELLERS */}
      <section className="home-section">
        <div className="home-container">
          <div className="sectionHead">
            <h2>{copy.bestSellersTitle}</h2>
            <p>{copy.bestSellersSubtitle}</p>
          </div>

          <div className="home-grid stagger-children">
            {showProductSkeletons && Array.from({ length: 8 }).map((_, index) => (
              <div key={`home-product-skeleton-${index}`} className="home-card home-card-skeleton" aria-hidden="true">
                <div className="cardImg skeleton-img" />
                <div className="cardBody">
                  <div className="skeleton-line skeleton-line-short" />
                  <div className="skeleton-line skeleton-line-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line-wide" />
                  <div className="skeleton-pill-row">
                    <span />
                    <span />
                  </div>
                  <div className="skeleton-button" />
                </div>
              </div>
            ))}

            {!showProductSkeletons && featured.map((p) => {
              const inStock = p.variants?.some((v) => v.stock_quantity > 0) ?? true;
              const imageUrl = resolveProductImageUrl({
                primaryImageUrl: p.primary_image_url,
                productName: p.name,
                productSlug: p.slug,
                productId: p.id || 1,
              });
              const canonicalSlug = p.slug.replace(/-[0-9a-f]{8,}$/i, '');
              const pm = productMeta[canonicalSlug] || {};
              const category = pm.category || (p as any).tags?.[0]?.name || '';
              const backendLabels = toTextList((p as any).chips).length > 0
                ? toTextList((p as any).chips)
                : toTextList((p as any).custom_labels);
              const backendPairing = toTextList((p as any).pair_with).join(' / ') || stripHtml((p as any).pair_with);
              const desc = stripHtml(p.short_description || (p as any).description || pm.desc || '');
              const chips = backendLabels.length > 0 ? backendLabels : (pm.chips || []);
              const pairing = backendPairing || pm.pairing || '';
              const badge = (p as any).badge || pm.badge || '';
              const weight = p.variants?.[0]?.name || '200g Jar';
              const reviewSnapshot = getProductReviewSnapshot(p);
              return (
                <div key={p.id} className="home-card group animate-on-scroll fade-up" data-testid="storefront-product-card">
                  <Link to={`/products/${p.slug}`} className="block">
                    <div className="cardImg">
                      <ProductCardImage src={imageUrl} alt={p.name} />
                      {badge && <div className="cardBadge">{badge}</div>}
                    </div>
                  </Link>
                  <div className="cardBody">
                    {(category || p.brand?.name) && (
                      <div className="cardCategory flex gap-2">
                        {category && <span>{category}</span>}
                        {p.brand?.name && <span className="font-semibold text-brand-700">{p.brand.name}</span>}
                      </div>
                    )}
                    <Link to={`/products/${p.slug}`} className="block">
                      <div className="cardTitle group-hover:text-brand-700 transition-colors">{p.name}</div>
                    </Link>
                    {desc && <p className="cardDesc">{desc}</p>}
                    {chips.length > 0 && (
                      <div className="cardChips">
                        {chips.map((c: string, i: number) => <span key={`c_${i}`} className="chip">{c}</span>)}
                      </div>
                    )}
                    {pairing && <div className="cardPairing">Best with: {pairing}</div>}
                    <div className="cardPriceRow">
                      <div className="cardPriceLeft">
                        <span className="price">₹{p.price}</span>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="priceOld">₹{p.compare_at_price}</span>
                        )}
                      </div>
                      <span className="cardWeight">{weight}</span>
                    </div>
                    {(reviewSnapshot.averageRating != null && reviewSnapshot.averageRating > 0) && (
                      <div className="flex items-center gap-1.5 mt-1 mb-1">
                        <span className="text-amber-500 text-sm leading-none">{'★'.repeat(Math.round(reviewSnapshot.averageRating))}{'☆'.repeat(5 - Math.round(reviewSnapshot.averageRating))}</span>
                        {reviewSnapshot.reviewCount > 0 && (
                          <span className="text-xs text-slate-500">({reviewSnapshot.reviewCount})</span>
                        )}
                      </div>
                    )}
                    <div className="cardCta">
                      {inStock ? (
                        <button
                          className={`btnAddCart ${cartFeedback?.productId === p.id && cartFeedback.status === 'added' ? 'btnAddCartSuccess' : ''}`}
                          disabled={cartFeedback?.productId === p.id}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(p);
                          }}
                        >
                          {cartFeedback?.productId === p.id && cartFeedback.status === 'adding'
                            ? copy.addingToCart
                            : cartFeedback?.productId === p.id && cartFeedback.status === 'added'
                              ? copy.addedToCart
                              : copy.addToCart}
                        </button>
                      ) : (
                        <button className="btnAddCart btnSoldOut" disabled>
                          {copy.soldOut}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="center mt-12">
            <Link className="btnSecondary border-brand-200 text-brand-800 hover:bg-brand-50" to="/products">
              {copy.viewAllProducts}
            </Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="home-section softBg" id="why-choose-us">
        <div className="home-container">
          <div className="sectionHead text-center animate-on-scroll fade-up">
            <h2>{copy.whyChooseTitle}</h2>
            <p className="animate-on-scroll fade-up" data-animate-delay="80ms">{copy.whyChooseSubtitle}</p>
          </div>

          <div className="home-grid mt-12 stagger-children">
            {[
              {
                title: "Authentic Family Recipes",
                desc: "Inspired by time-honoured Tamil home cooking.",
                icon: "🍛"
              },
              {
                title: "No Preservatives",
                desc: "Made with ingredients you can trust.",
                icon: "🌿"
              },
              {
                title: "Small Batch Handmade",
                desc: "Prepared carefully for freshness and flavour.",
                icon: "🫙"
              },
              {
                title: "Pan-India Delivery",
                desc: "Traditional taste shipped across India.",
                icon: "📦"
              }
            ].map((feature, idx) => (
              <div key={idx} className="animate-on-scroll fade-up bg-white rounded-[18px] p-8 border border-slate-100 shadow-sm text-center" style={{ transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s cubic-bezier(0.22,1,0.36,1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(15,23,42,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div className="text-4xl mb-4" style={{ transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}>{feature.icon}</div>
                <h3 className="font-bold text-[17px] text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-[14px] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO TEXT / BRAND STORY */}
      <section className="home-section story-section">
        <div className="home-container twoCol">
          <div className="animate-on-scroll fade-up pr-0 lg:pr-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 leading-tight">Authentic Tamil Pickles, Thokku &amp; Podi — Made the Traditional Way</h2>
            <p className="mb-4 text-slate-700 leading-relaxed text-lg animate-on-scroll fade-up" data-animate-delay="80ms">
              At {BRAND}, we bring you <strong>traditional Tamil foods</strong> crafted with time-honoured
              recipes. From tangy <strong>oorugai</strong> like mango, lime and citron pickles to rich,
              slow-cooked <strong>thokku</strong> and aromatic <strong>podi</strong>, every product is made
              in small batches for freshness and flavour.
            </p>
            <p className="mb-6 text-slate-700 leading-relaxed text-lg animate-on-scroll fade-up" data-animate-delay="160ms">
              We use ingredients loved in Tamil kitchens — curry leaves, sesame, garlic, horse gram,
              moringa and native herbs — and focus on authentic taste, purity, and hygiene.
              Whether you eat it with hot rice and ghee, idli, dosa or curd rice, our food is made to
              feel like home.
            </p>
            <Link className="arrow-link text-brand-700 font-bold underline-offset-4 decoration-2 animate-on-scroll fade-up" data-animate-delay="240ms" to="/pages/about">
              Read Our Story
            </Link>
          </div>

          <div className="animate-on-scroll scale-in ingredientPanel h-fit self-center" data-animate-delay="150ms">
            <div className="ingredientTitle text-2xl text-slate-900 border-b border-slate-100 pb-4 mb-5">Made with ingredients we trust</div>
            <ul className="ingredientList text-slate-700 space-y-4 font-medium text-[15px]">
              <li className="flex gap-3 items-center"><span className="text-xl">🌿</span> Curry Leaves, Coriander &amp; Herbs</li>
              <li className="flex gap-3 items-center"><span className="text-xl">🧄</span> Garlic &amp; Traditional Spices</li>
              <li className="flex gap-3 items-center"><span className="text-xl">🌰</span> Sesame &amp; Lentils</li>
              <li className="flex gap-3 items-center"><span className="text-xl">🥬</span> Moringa, Vallarai &amp; Horse Gram</li>
            </ul>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="dark-section">

        <div className="home-container relative z-10">
          <div className="sectionHead text-center animate-on-scroll fade-up">
            <h2 className="text-white">What Customers Say</h2>
            <p className="text-brand-100/80 animate-on-scroll fade-up" data-animate-delay="80ms">Real reviews from food lovers across India.</p>
          </div>

          <div className="reviewGrid stagger-children">
            {[
              { name: "Priya S.", city: "Chennai", text: "The mango pickle tastes exactly like my grandmother used to make." },
              { name: "Ravi K.", city: "Bengaluru", text: "Vallarai podi is amazing with hot rice and ghee." },
              { name: "Meena R.", city: "Mumbai", text: "Neat packaging and authentic flavour. Loved the thokku!" }
            ].map((r, i) => (
              <div key={i} className="reviewCard animate-on-scroll fade-up">
                <div className="ratingRow text-amber-400 text-sm tracking-widest mb-3">★★★★★</div>
                <p className="reviewText text-lg italic text-brand-50 mb-6">“{r.text}”</p>
                <div className="reviewMeta border-t border-brand-700/50 pt-4">
                  <span className="reviewName text-white">{r.name}</span>
                  <span className="muted text-brand-300 flex items-center gap-1.5 font-medium text-[13px] uppercase tracking-wide mt-1">
                    <svg className="w-3.5 h-3.5 text-accent-400" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Buyer • {r.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <div className="home-container ctaInner">
          <h2 className="font-serif animate-on-scroll fade-up">Ready to taste tradition?</h2>
          <p className="text-xl mt-3 mb-8 animate-on-scroll fade-up" data-animate-delay="100ms">Order your favourite pickles, thokku and podi — freshly made and shipped pan-India.</p>
          <div className="heroCtas justify-center gap-4 animate-on-scroll fade-up" data-animate-delay="180ms">
            <Link className="btnPrimary shadow-xl shadow-accent-900/20 text-lg px-10 py-4" to="/products">Browse Products</Link>
            <Link className="btnSecondary border-white/30 text-lg px-10 py-4 bg-transparent hover:bg-white/10" to="/pages/contact">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
