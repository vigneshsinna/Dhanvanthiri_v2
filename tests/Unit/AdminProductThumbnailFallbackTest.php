<?php

namespace Tests\Unit;

use App\Models\Product;
use Tests\TestCase;

class AdminProductThumbnailFallbackTest extends TestCase
{
    public function test_resolved_thumbnail_reference_falls_back_to_the_first_gallery_photo_when_the_saved_thumbnail_is_missing(): void
    {
        $product = new Product();
        $product->forceFill([
            'thumbnail_img' => '999999',
            'photos' => '/assets/img/logo.png,/assets/img/placeholder.jpg',
        ]);

        $this->assertSame('/assets/img/logo.png', $product->resolved_thumbnail_reference);
    }

    public function test_resolved_thumbnail_reference_prefers_the_saved_thumbnail_when_it_is_a_direct_asset_reference(): void
    {
        $product = new Product();
        $product->forceFill([
            'thumbnail_img' => '/assets/img/custom-thumb.png',
            'photos' => '/assets/img/logo.png,/assets/img/placeholder.jpg',
        ]);

        $this->assertSame('/assets/img/custom-thumb.png', $product->resolved_thumbnail_reference);
    }
}
