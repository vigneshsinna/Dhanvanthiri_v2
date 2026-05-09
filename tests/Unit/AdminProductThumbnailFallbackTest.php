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

    public function test_media_reference_sanitizer_removes_javascript_and_directory_fragments(): void
    {
        $this->assertSame(
            '/assets/img/logo.png,uploads/all/valid-product.webp',
            Product::sanitizeMediaReference('undefined,NaN,uploads/all/,/assets/img/logo.png,uploads/all/valid-product.webp')
        );
    }

    public function test_single_media_reference_sanitizer_keeps_only_one_valid_file(): void
    {
        $this->assertSame(
            '12',
            Product::sanitizeSingleMediaReference('undefined,NaN,uploads/all,12,13')
        );
    }

    public function test_uploader_preview_filters_invalid_references_without_undefined_cards(): void
    {
        $files = build_upload_preview_files('undefined,NaN,uploads/all,/assets/img/logo.png');

        $this->assertCount(1, $files);
        $this->assertSame('/assets/img/logo.png', $files[0]['id']);
        $this->assertSame('logo.png', $files[0]['file_original_name']);
    }

    public function test_upload_directory_is_not_treated_as_a_direct_asset(): void
    {
        $this->assertFalse(is_direct_asset_reference('uploads/all/'));
        $this->assertTrue(is_direct_asset_reference('uploads/all/valid-product.webp'));
    }
}
