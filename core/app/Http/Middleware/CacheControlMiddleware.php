<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Step 08 - Performance Strategy Middleware
 * 
 * Sets cache-control headers based on endpoint type and data sensitivity.
 * Follows the strategy defined in docs/08-performance-caching-cdn-strategy.md
 */
class CacheControlMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Only set cache headers on successful responses
        if (!$response->isSuccessful()) {
            return $response;
        }

        // ── Unauthenticated public endpoints (high cache) ──────────────
        if ($this->isPublicCacheable($request->path())) {
            $response->header('Cache-Control', 'public, max-age=3600'); // 1 hour
            $response->header('CDN-Cache-Control', 'max-age=86400'); // 1 day on CDN
        }
        // ── Public but less stable (medium cache) ────────────────────
        else if ($this->isPublicMediumCache($request->path())) {
            $response->header('Cache-Control', 'public, max-age=1800'); // 30 minutes
            $response->header('CDN-Cache-Control', 'max-age=3600'); // 1 hour on CDN
        }
        // ── Private/authenticated endpoints (no caching) ──────────────
        else if ($this->isPrivate($request->path())) {
            $response->header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            $response->header('Pragma', 'no-cache');
            $response->header('Expires', '0');
        }
        // ── Default: no caching ────────────────────────────────────────
        else {
            $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        }

        return $response;
    }

    /**
     * Public endpoints that are stable and can be cached aggressively
     */
    private function isPublicCacheable(string $path): bool
    {
        $patterns = [
            '/api/v2/categories',
            '/api/v2/brands',
            '/api/v2/business-settings',
            '/api/v2/banners',
            '/api/v2/sliders',
            '/api/v2/pages',
            '/api/v2/blogs',
            '/api/v2/policies',
            '/api/v2/languages',
            '/api/v2/currencies',
        ];

        foreach ($patterns as $pattern) {
            if (strpos($path, $pattern) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Public endpoints with medium stability (product listings, search, etc.)
     */
    private function isPublicMediumCache(string $path): bool
    {
        $patterns = [
            '/api/v2/products',
            '/api/v2/search',
            '/api/v2/shops',
        ];

        foreach ($patterns as $pattern) {
            if (strpos($path, $pattern) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Private endpoints that should never be cached
     */
    private function isPrivate(string $path): bool
    {
        $patterns = [
            '/api/v2/auth',
            '/api/v2/me',
            '/api/v2/cart',
            '/api/v2/checkout',
            '/api/v2/orders',
            '/api/v2/account',
            '/api/v2/wishlist',
            '/api/v2/addresses',
            '/panel/',
        ];

        foreach ($patterns as $pattern) {
            if (strpos($path, $pattern) === 0) {
                return true;
            }
        }

        return false;
    }
}
