import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductQuery, useReviewsQuery, useSubmitReviewMutation, useRecommendationsQuery } from '@/features/catalog/api';
import { ProductQASection, FrequentlyBoughtTogether } from '@/features/catalog/components/ProductSocialProof';
import { useAddCartItemMutation } from '@/features/cart/api';
import { useWishlistQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/features/wishlist/api';
import { useAppSelector } from '@/lib/utils/hooks';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Helmet } from 'react-helmet-async';
import { fallbackProducts } from '@/lib/fallbackData';
import { getProductDetailBySlug, productCatalogData } from '@/features/catalog/data/productCatalogData';
import { addToRecentlyViewed, getRecentlyViewed, type RecentlyViewedProduct } from '@/features/catalog/recentlyViewed';
import { getProductReviewSnapshot, toReviewCollection } from '@/features/catalog/lib/reviewsViewModel';
import { unwrapCollection } from '@/lib/collections';
import { resolveProductImageGallery, resolveProductImageUrl } from '@/lib/productImage';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface Variant {
  id: number;
  name: string;
  sku: string;
  price_override: number | null;
  stock_quantity: number;
  weight?: number | null;
}

interface ProductImage {
  id: number;
  url?: string;
  path?: string;
  alt_text?: string;
  sort_order: number;
}

interface Review {
  id: number;
  rating: number;
  title?: string;
  body: string;
  status: string;
  photos?: string[];
  user?: { name: string };
  reviewer_name?: string;
  custom_reviewer_name?: string;
  created_at: string;
}

interface Recommendation {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  primary_image_url?: string | null;
  thumbnail_image?: string | null;
  images?: ProductImage[];
}

const SITE_URL = 'https://dhanvanthirifoods.in';
const API_ORIGIN = ((import.meta as any).env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')) || '';

export function ProductDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useProductQuery(slug || '');
  const addToCart = useAddCartItemMutation();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlist = useAddToWishlistMutation();
  const removeFromWishlist = useRemoveFromWishlistMutation();
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  // Use API product or fall back to static data
  const apiProduct = data?.data?.data ?? data?.data;
  const fallbackProduct = !apiProduct ? fallbackProducts.find((p) => p.slug === slug) : null;
  const product = apiProduct || fallbackProduct;

  // Get rich details from catalog data
  const detail = slug ? getProductDetailBySlug(slug) : undefined;

  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Wishlist state
  const wishlistItems = unwrapCollection<any>(wishlistData);
  const wishlistEntry = product ? wishlistItems.find((w: any) => w.product_id === product.id) : null;
  const isInWishlist = Boolean(wishlistEntry);

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id);
    } else {
      addToWishlist.mutate({ product_id: product.id, variant_id: selectedVariant, slug: product.slug });
    }
  };

  // Reviews
  const { data: reviewsData } = useReviewsQuery(product?.id ?? 0);
  const reviewCollection = toReviewCollection(reviewsData);
  const reviews: Review[] = reviewCollection.reviews as Review[];
  const submitReview = useSubmitReviewMutation(product?.id ?? 0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Related products (same category, excluding current)
  const relatedProducts = useMemo(() => {
    if (!detail) return [];
    return productCatalogData
      .filter((p) => p.category === detail.category && p.slug !== detail.slug)
      .slice(0, 4);
  }, [detail]);

  // API recommendations (preferred) with fallback to static related products
  const { data: recommendationsData } = useRecommendationsQuery({
    product_id: product?.id,
    category_id: product?.category_id ?? product?.category?.id,
    limit: 4,
  });

  const apiRecommendations: Recommendation[] = useMemo(() => {
    return unwrapCollection<Recommendation>(recommendationsData);
  }, [recommendationsData]);

  const backendRecommendationBySlug = useMemo(() => {
    return new Map(apiRecommendations.map((item) => [item.slug, item]));
  }, [apiRecommendations]);

  const recentlyViewed: RecentlyViewedProduct[] = useMemo(() => {
    return getRecentlyViewed()
      .filter((item) => item.slug !== product?.slug)
      .slice(0, 4);
  }, [product?.id, product?.slug]);

  // Track recently viewed products
  useEffect(() => {
    if (product && product.id) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: resolveProductImageUrl({
          primaryImageUrl: product.primary_image_url,
          imagePaths: unwrapCollection<ProductImage>(product.images).map((image) => image.url || image.path),
          productName: product.name,
          productSlug: product.slug,
          productId: product.id,
        }) || null,
      });
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading && !fallbackProduct) return <PageLoader />;
  if (error && !product) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('Product Not Found', 'தயாரிப்பு கிடைக்கவில்லை')}</h1>
        <p className="mt-2 text-slate-600">{t("The product you're looking for doesn't exist.", 'நீங்கள் தேடும் தயாரிப்பு இல்லை.')}</p>
        <Link to="/products" className="mt-4 inline-block text-brand-700 hover:underline">{t('Browse products', 'தயாரிப்புகளை பார்க்க')}</Link>
      </div>
    );
  }

  if (!product) return <PageLoader />;

  const variants = unwrapCollection<Variant>(product.variants);
  const images = unwrapCollection<ProductImage>(product.images);
  const tags = unwrapCollection<{ name: string }>(product.tags);

  const galleryImages = resolveProductImageGallery({
    primaryImageUrl: product.primary_image_url,
    imagePaths: images.map((image) => image.url || image.path),
    productName: product.name,
    productSlug: product.slug,
    productId: product.id || 1,
  });
  const imageUrl = galleryImages[0];
  const activeVariant = variants.find((v: Variant) => v.id === selectedVariant) ?? variants[0];
  const price = activeVariant?.price_override ?? product.price;
  const inStock = activeVariant ? activeVariant.stock_quantity > 0 : true;

  const productTitle = product.name || detail?.title || '';
  const seoTitle = detail?.seo_title || `${productTitle} - Dhanvanthiri Foods`;
  const seoDesc = product.short_description || detail?.seo_description || product.meta_description || '';
  const reviewSnapshot = getProductReviewSnapshot(product);

  const handleAddToCart = () => {
    addToCart.mutate({
      product_id: product.id,
      variant_id: activeVariant?.id,
      quantity,
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('rating', reviewForm.rating.toString());
      if (reviewForm.title) formData.append('title', reviewForm.title);
      formData.append('body', reviewForm.body);
      reviewPhotos.forEach((file) => formData.append('photos[]', file));

      await submitReview.mutateAsync(formData as any);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', body: '' });
      setReviewPhotos([]);
    } catch { /* handled by UI */ }
  };

  // JSON-LD for product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productTitle,
    description: product.short_description || detail?.short_description || '',
    url: `${SITE_URL}/products/${slug}`,
    image: imageUrl,
    brand: { '@type': 'Brand', name: 'Dhanvanthiri Foods' },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'INR',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Dhanvanthiri Foods' },
    },
    ...(reviewSnapshot.averageRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewSnapshot.averageRating,
        reviewCount: reviewSnapshot.reviewCount,
      },
    }),
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        {seoDesc && <meta name="description" content={seoDesc} />}
        <link rel="canonical" href={`${SITE_URL}/products/${slug}`} />
        <meta property="og:title" content={seoTitle} />
        {seoDesc && <meta property="og:description" content={seoDesc} />}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${SITE_URL}/products/${slug}`} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500 animate-on-scroll top-down">
        <Link to="/" className="hover:text-brand-700">{t('Home', 'முகப்பு')}</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-brand-700">{t('Products', 'தயாரிப்புகள்')}</Link>
        {detail?.category && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/products?category=${detail.category.toLowerCase()}`} className="hover:text-brand-700">
              {detail.category}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-900">{productTitle}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 stagger-children">
        {/* ─── Image Gallery ─── */}
        <div className="space-y-3 animate-on-scroll slide-left">
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
            {imageUrl ? (
              <img
                src={galleryImages[selectedImage] || imageUrl}
                alt={images[selectedImage]?.alt_text || productTitle}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-6xl', 'text-slate-300');
                  e.currentTarget.insertAdjacentHTML('afterend', '<span>🫙</span>');
                }}
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={productTitle}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-6xl', 'text-slate-300');
                  e.currentTarget.insertAdjacentHTML('afterend', '<span>🫙</span>');
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-slate-300">🫙</div>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {galleryImages.map((galleryImage, i: number) => (
                <button
                  key={`${galleryImage}-${i}`}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === selectedImage ? 'border-brand-500' : 'border-transparent'}`}
                >
                  <img src={galleryImage} alt={images[i]?.alt_text || productTitle} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Info ─── */}
        <div className="space-y-5 animate-on-scroll slide-right">
          {/* Badge + Category */}
          <div className="flex flex-wrap items-center gap-2">
            {detail?.badge && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                {detail.badge}
              </span>
            )}
            {detail?.category && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {detail.category}
              </span>
            )}
            {product?.brand?.name && (
              <span className="rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                {product.brand.name}
              </span>
            )}
            {product?.custom_labels && Object.values(product.custom_labels as Record<string, string>).map((label, i) => (
              <span key={`l_${i}`} className="rounded-full bg-brand-100 pt-1 pb-1 px-3 text-xs font-semibold tracking-wider text-brand-800 uppercase">
                {label}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }} data-testid="storefront-product-title">
            {productTitle}
          </h1>
          {detail?.tamil_title && (
            <div className="text-xl font-medium text-brand-700/80 -mt-2">
              {detail.tamil_title}
            </div>
          )}

          {/* Short description */}
          {(product.short_description || detail?.short_description) && (
            <p className="text-base leading-relaxed text-slate-600">{product.short_description || detail?.short_description}</p>
          )}

          {/* Rating */}
          {reviewSnapshot.averageRating != null && reviewSnapshot.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg text-yellow-500">
                {'★'.repeat(Math.round(reviewSnapshot.averageRating))}{'☆'.repeat(5 - Math.round(reviewSnapshot.averageRating))}
              </span>
              <span className="text-sm text-slate-500">({reviewSnapshot.reviewCount} {t('reviews', 'மதிப்புரைகள்')})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900" data-testid="storefront-product-price">₹{price}</span>
            {product.compare_at_price && product.compare_at_price > price && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{product.compare_at_price}</span>
                <Badge variant="danger">
                  {Math.round(((product.compare_at_price - price) / product.compare_at_price) * 100)}% OFF
                </Badge>
              </>
            )}
            {detail?.weight && (
              <span className="text-sm text-slate-400">/ {detail.weight}</span>
            )}
          </div>

          {/* Chips */}
          {detail && detail.chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {detail.chips.map((chip, i) => (
                <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Tags from API */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag: { name: string }) => (
                <Badge key={tag.name} variant="success">{tag.name}</Badge>
              ))}
            </div>
          )}

          {/* Taste Profile */}
          {detail?.taste_profile && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm animate-on-scroll scale-in">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Taste Profile', 'சுவை விவரம்')}</h3>
              <p className="text-sm font-medium text-slate-700">{detail.taste_profile}</p>
            </div>
          )}

          {/* Pair With */}
          {detail && detail.pair_with.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm animate-on-scroll scale-in">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t('Best Paired With', 'இணைந்து சாப்பிட')}</h3>
              <div className="flex flex-wrap gap-2">
                {detail.pair_with.map((item, i) => (
                  <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selector */}
          {variants.length > 1 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">{t('Size / Variant', 'அளவு / வகை')}</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: Variant) => {
                  const variantName = v.name || detail?.weight || (v.weight ? `${v.weight * 1000}g` : '200g');
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${(selectedVariant ?? variants[0]?.id) === v.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                        } ${v.stock_quantity <= 0 ? 'opacity-50' : ''}`}
                      disabled={v.stock_quantity <= 0}
                    >
                      {variantName}
                      {v.price_override && <span className="ml-1 text-xs text-slate-400">₹{v.price_override}</span>}
                      {v.stock_quantity <= 0 && <span className="ml-1 text-xs text-red-500">({t('Out of stock', 'கையிருப்பு இல்லை')})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button
                className="px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >−</button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                className="px-3 py-2 text-slate-600 hover:bg-slate-50"
                onClick={() => setQuantity(quantity + 1)}
              >+</button>
            </div>
            <Button className="flex-1" disabled={!inStock} loading={addToCart.isPending} onClick={handleAddToCart} data-testid="storefront-add-to-cart">
              {inStock ? t('Add to Cart', 'கார்டில் சேர்') : t('Out of Stock', 'கையிருப்பு இல்லை')}
            </Button>
            <button
              onClick={handleWishlistToggle}
              disabled={addToWishlist.isPending || removeFromWishlist.isPending}
              className={`rounded-lg border p-2.5 transition-colors ${isInWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-300 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500'}`}
              aria-label={isInWishlist ? t('Remove from Wishlist', 'விருப்பப்பட்டியலிலிருந்து நீக்கு') : t('Add to Wishlist', 'விருப்பப்பட்டியலில் சேர்')}
              title={isInWishlist ? t('Remove from Wishlist', 'விருப்பப்பட்டியலிலிருந்து நீக்கு') : t('Add to Wishlist', 'விருப்பப்பட்டியலில் சேர்')}
            >
              <svg className="h-5 w-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Cart feedback */}
          {addToCart.isSuccess && (
            <p className="text-sm text-green-600 font-medium animate-pulse">✓ {t('Added to cart!', 'கார்டில் சேர்க்கப்பட்டது!')}</p>
          )}
          {addToCart.isError && (
            <p className="text-sm text-red-600 font-medium">
              {(addToCart.error as any)?.response?.data?.message || t('Failed to add to cart. Please try again.', 'கார்டில் சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')}
            </p>
          )}

          {/* Stock status */}
          {activeVariant && (
            <p className={`text-sm ${activeVariant.stock_quantity <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
              {activeVariant.stock_quantity <= 0
                ? t('Out of stock', 'கையிருப்பு இல்லை')
                : activeVariant.stock_quantity <= 5
                  ? `${t('Only', 'மட்டுமே')} ${activeVariant.stock_quantity} ${t('left!', 'உள்ளது!')}`
                  : t('In stock', 'கையிருப்பில் உள்ளது')}
            </p>
          )}

          {/* Warranty info */}
          {product.warranty && (
            <div className="flex items-start gap-2 rounded-lg bg-green-50/60 border border-green-100 px-4 py-3 animate-on-scroll scale-in">
              <span className="text-base mt-0.5">🛡️</span>
              <div>
                <p className="text-xs font-semibold text-green-800">{product.warranty.name}</p>
                <p className="text-xs text-green-700">
                  {product.warranty.duration_days >= 365
                    ? `${Math.floor(product.warranty.duration_days / 365)} year${product.warranty.duration_days >= 730 ? 's' : ''}`
                    : product.warranty.duration_days >= 30
                      ? `${Math.floor(product.warranty.duration_days / 30)} month${product.warranty.duration_days >= 60 ? 's' : ''}`
                      : `${product.warranty.duration_days} day${product.warranty.duration_days > 1 ? 's' : ''}`
                  } {product.warranty.type} warranty
                </p>
              </div>
            </div>
          )}

          {/* Storage info */}
          {detail?.storage && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 border border-amber-100 px-4 py-3 animate-on-scroll scale-in">
              <span className="text-base mt-0.5">📋</span>
              <p className="text-xs leading-relaxed text-amber-800">{detail.storage}</p>
            </div>
          )}

          {/* SKU */}
          {activeVariant?.sku && (
            <p className="text-xs text-slate-400">SKU: {activeVariant.sku}</p>
          )}
        </div>
      </div>

      {/* ─── About & Why You'll Love It ─── */}
      {detail && (
        <div className="mt-12 grid gap-8 lg:grid-cols-2 stagger-children">
          {/* About This Product */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-on-scroll scale-in">
            <h2 className="mb-4 text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('About This Product', 'இந்த தயாரிப்பை பற்றி')}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{detail.about}</p>

            {/* Description from API */}
            {product.description && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="prose prose-sm text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
              </div>
            )}
          </div>

          {/* Why You'll Love It */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-on-scroll scale-in">
            <h2 className="mb-4 text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Why You'll Love It", 'நீங்கள் ஏன் விரும்புவீர்கள்')}
            </h2>
            <ul className="space-y-3">
              {detail.why_love.map((reason, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-slate-700">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ─── If no detail data, fall back to API description ─── */}
      {!detail && product.description && (
        <div className="mt-12 border-t pt-8 animate-on-scroll top-down">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('Description', 'விவரம்')}</h2>
          <div className="prose prose-sm text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
        </div>
      )}

      {/* ─── Size Chart ─── */}
      {product.size_chart && product.size_chart.headers && product.size_chart.rows && (
        <div className="mt-12 border-t pt-8 animate-on-scroll top-down">
          <h2 className="mb-4 text-xl font-semibold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Size Chart — {product.size_chart.name}
          </h2>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  {product.size_chart.headers.map((h: string) => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.size_chart.rows.map((row: string[], i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {row.map((cell: string, ci: number) => (
                      <td key={ci} className={`px-6 py-2 ${ci === 0 ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Reviews Section ─── */}
      <div className="mt-12 border-t pt-8 animate-on-scroll top-down">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{t('Customer Reviews', 'வாடிக்கையாளர் மதிப்புரைகள்')}</h2>
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
              {t('Write a Review', 'மதிப்புரை எழுத')}
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mt-4 rounded-xl border bg-white p-4 space-y-3 animate-on-scroll scale-in">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('Rating', 'மதிப்பீடு')}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                  >★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('Title (optional)', 'தலைப்பு (விருப்பம்)')}</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('Review', 'மதிப்புரை')}</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('Add Photos (Max 3)', 'படங்கள் சேர் (அதிகம் 3)')}</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setReviewPhotos(Array.from(e.target.files).slice(0, 3));
                  }
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>
            <Button type="submit" size="sm" loading={submitReview.isPending}>{t('Submit Review', 'மதிப்புரை சமர்ப்பி')}</Button>
          </form>
        )}

        {/* Reviews List */}
        <div className="mt-4 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{t('No reviews yet. Be the first to review!', 'இன்னும் மதிப்புரைகள் இல்லை. முதலில் மதிப்புரை எழுதுங்கள்!')}</p>
          ) : (
            reviews.filter((r: Review) => r.status === 'approved').map((review: Review) => (
              <div key={review.id} className="rounded-xl border bg-white p-4 animate-on-scroll scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-yellow-500">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    {review.title && <span className="ml-2 font-medium">{review.title}</span>}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{review.body}</p>
                {review.photos && review.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {review.photos.map((photo, i) => (
                      <a href={photo.startsWith('http') ? photo : `${API_ORIGIN}${photo}`} target="_blank" rel="noopener noreferrer" key={i}>
                        <img
                          src={photo.startsWith('http') ? photo : `${API_ORIGIN}${photo}`}
                          alt="Review attachment"
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  By {review.reviewer_name ?? review.custom_reviewer_name ?? review.user?.name ?? 'Customer'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommendations section */}
      {(apiRecommendations.length > 0 || relatedProducts.length > 0) && (
        <div className="mt-12 border-t pt-8 animate-on-scroll top-down">
          <h2 className="mb-6 text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('You May Also Like', 'நீங்களுக்கு பிடிக்கும்')}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {(apiRecommendations.length > 0 ? apiRecommendations : relatedProducts.map((item) => ({
              id: 0,
              name: item.title,
              slug: item.slug,
              price: item.price,
              image: null,
            }))).map((related) => {
              const relFallback = fallbackProducts.find((fp) => fp.slug === related.slug);
              const relatedImages = unwrapCollection<ProductImage>((related as Recommendation).images);
              const relImage = resolveProductImageUrl({
                primaryImageUrl:
                  (related as Recommendation).primary_image_url ||
                  (related as Recommendation).thumbnail_image ||
                  related.image ||
                  relFallback?.primary_image_url,
                imagePaths: relatedImages.map((image) => image.url || image.path),
                productName: related.name,
                productSlug: related.slug,
                productId: related.id || relFallback?.id || 1,
              });

              return (
                <Link
                  key={related.slug}
                  to={`/products/${related.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md animate-on-scroll scale-in"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                    <img
                      src={relImage}
                      alt={related.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                        e.currentTarget.insertAdjacentHTML('afterend', '<div class="text-4xl">?</div>');
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {related.name}
                    </h3>
                    <p className="mt-2 text-base font-bold text-slate-900">Rs {related.price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Q&A Section */}
      {product?.id && <ProductQASection productId={product.id} />}

      {/* Frequently Bought Together */}
      {product?.id && <FrequentlyBoughtTogether productId={product.id} />}

      {/* Recently viewed section */}
      {recentlyViewed.length > 0 && (
        <div className="mt-12 border-t pt-8 animate-on-scroll top-down">
          <h2 className="mb-6 text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('Recently Viewed', 'சமீபத்தில் பார்த்தவை')}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {recentlyViewed.map((item) => (
              (() => {
                const backendItem = backendRecommendationBySlug.get(item.slug);
                const image = resolveProductImageUrl({
                  primaryImageUrl:
                    backendItem?.primary_image_url ||
                    backendItem?.thumbnail_image ||
                    backendItem?.image ||
                    item.image,
                  imagePaths: unwrapCollection<ProductImage>(backendItem?.images).map((img) => img.url || img.path),
                  productName: backendItem?.name || item.name,
                  productSlug: item.slug,
                  productId: backendItem?.id || item.id || 1,
                }) || '';

                return (
                  <Link
                    key={item.slug}
                    to={`/products/${item.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md animate-on-scroll scale-in"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                      <img
                        src={image}
                        alt={backendItem?.name || item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                          e.currentTarget.insertAdjacentHTML('afterend', '<div class="text-4xl">?</div>');
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {backendItem?.name || item.name}
                      </h3>
                      <p className="mt-2 text-base font-bold text-slate-900">Rs {backendItem?.price ?? item.price}</p>
                    </div>
                  </Link>
                );
              })()
            ))}
          </div>
        </div>
      )}
    </>
  );
}
