<?php

return [

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
