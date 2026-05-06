<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Storefront Mode
    |--------------------------------------------------------------------------
    |
    | The Laravel route service provider uses this value to decide whether
    | public storefront paths should be served by the legacy Blade storefront
    | or the React shell.
    |
    */

    'mode' => env('STOREFRONT_MODE', 'blade'),

    /*
    |--------------------------------------------------------------------------
    | React Storefront Asset Prefix
    |--------------------------------------------------------------------------
    |
    | Public URL prefix used by the headless storefront controller when serving
    | built React assets from the Laravel application.
    |
    */

    'asset_prefix' => env('STOREFRONT_ASSET_PREFIX', '/storefront-assets'),

    /*
    |--------------------------------------------------------------------------
    | React Storefront Build Path
    |--------------------------------------------------------------------------
    |
    | Filesystem location of the built React storefront consumed by
    | HeadlessStorefrontController.
    |
    */

    'dist_path' => env('STOREFRONT_DIST_PATH', base_path('frontend/dist')),

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

];
