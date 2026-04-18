<?php

namespace Tests\Feature\Storefront;

use Tests\TestCase;

class HeadlessStorefrontRouteTest extends TestCase
{
    protected function enableReactStorefront(): void
    {
        putenv('STOREFRONT_MODE=react');
        $_ENV['STOREFRONT_MODE'] = 'react';
        $_SERVER['STOREFRONT_MODE'] = 'react';
        $this->refreshApplication();
    }

    public function test_root_serves_react_storefront_when_headless_mode_is_enabled(): void
    {
        $this->enableReactStorefront();

        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $response->assertSee('/storefront-assets/', false);
    }

    public function test_storefront_product_path_falls_back_to_react_shell_when_headless_mode_is_enabled(): void
    {
        $this->enableReactStorefront();

        $response = $this->get('/products/poondu-thokku');

        $response->assertOk();
        $response->assertSee('<div id="root"></div>', false);
    }
}
