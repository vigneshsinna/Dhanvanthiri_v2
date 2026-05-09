const DEFAULT_API_ORIGIN = ((import.meta as any).env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')) || '';
const PLACEHOLDER_IMAGE_PATTERN = /\/assets\/img\/placeholder(?:-[^./]+)?\.(jpg|jpeg|png|webp|svg)$/i;
const INVALID_IMAGE_PATH_PATTERN = /(?:^|\/)(?:core\/public\/|public\/)?uploads\/all\/?$/i;

interface ProductImageOptions {
  apiOrigin?: string;
  imagePaths?: Array<string | null | undefined>;
  primaryImageUrl?: string | null;
  productId?: number;
  productName?: string;
  productSlug?: string;
}

export function resolveProductAssetUrl(imageUrl?: string | null, apiOrigin = DEFAULT_API_ORIGIN): string | undefined {
  if (!imageUrl) {
    return undefined;
  }

  const normalized = imageUrl.trim();
  if (!normalized) {
    return undefined;
  }

  const pathname = normalized.match(/^(https?:)?\/\//i)
    ? (() => {
        try {
          return new URL(normalized, 'https://dhanvanthrifoods.com').pathname;
        } catch {
          return normalized;
        }
      })()
    : normalized;

  if (INVALID_IMAGE_PATH_PATTERN.test(pathname.replace(/\/+$/, ''))) {
    return undefined;
  }

  if (/^(https?:|data:|blob:|\/\/)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return apiOrigin ? `${apiOrigin}${normalized}` : normalized;
  }

  return apiOrigin ? `${apiOrigin}/${normalized.replace(/^\/+/, '')}` : normalized;
}

export function isPlaceholderProductImage(imageUrl?: string | null): boolean {
  const resolved = resolveProductAssetUrl(imageUrl);
  return Boolean(resolved && PLACEHOLDER_IMAGE_PATTERN.test(resolved));
}

export function resolveProductImageGallery(options: ProductImageOptions): string[] {
  const candidates = [options.primaryImageUrl, ...(options.imagePaths ?? [])]
    .map((imageUrl) => resolveProductAssetUrl(imageUrl, options.apiOrigin))
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

  const usableImages = [...new Set(candidates.filter((imageUrl) => !isPlaceholderProductImage(imageUrl)))];
  if (usableImages.length > 0) {
    return usableImages;
  }

  return candidates.filter((imageUrl) => !isPlaceholderProductImage(imageUrl));
}

export function resolveProductImageUrl(options: ProductImageOptions): string | undefined {
  return resolveProductImageGallery(options)[0];
}
