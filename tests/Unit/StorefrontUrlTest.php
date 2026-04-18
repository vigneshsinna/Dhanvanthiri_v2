<?php

namespace Tests\Unit;

use Tests\TestCase;

class StorefrontUrlTest extends TestCase
{
    public function test_storefront_url_prefers_configured_frontend_url(): void
    {
        config()->set('app.frontend_url', 'https://store.example.com/');
        config()->set('app.url', 'https://backend.example.com');

        $this->assertSame('https://store.example.com', storefront_url());
    }

    public function test_storefront_url_falls_back_to_app_url_when_frontend_url_is_not_configured(): void
    {
        config()->set('app.frontend_url', null);
        config()->set('app.url', 'https://backend.example.com/');

        $this->assertSame('https://backend.example.com', storefront_url());
    }
}
