<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Storefront Mode
    |--------------------------------------------------------------------------
    |
    | `legacy` keeps the original Blade storefront routes active.
    | `react` serves the built React storefront shell for customer-facing pages
    | while leaving Laravel admin and operational routes intact.
    |
    */

    'mode' => env('STOREFRONT_MODE', 'legacy'),

    /*
    |--------------------------------------------------------------------------
    | Storefront URL
    |--------------------------------------------------------------------------
    |
    | The public-facing storefront URL used by admin views, API resources,
    | emails, and redirect logic when generating customer-facing links.
    | Falls back to APP_URL if FRONTEND_URL is not set.
    |
    */

    'url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),

    /*
    |--------------------------------------------------------------------------
    | React Build Paths
    |--------------------------------------------------------------------------
    */

    'dist_path' => base_path(env('STOREFRONT_DIST_PATH', 'frontend/dist')),
    'asset_prefix' => env('STOREFRONT_ASSET_PREFIX', '/storefront-assets'),

];
