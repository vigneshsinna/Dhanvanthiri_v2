<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\Page;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LegacyContentImportTest extends TestCase
{
    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    /** @test */
    public function legacy_import_seeds_products_with_live_images_and_descriptions(): void
    {
        Artisan::call('db:seed', ['--class' => 'LegacyStorefrontContentSeeder']);
        Artisan::call('db:seed', ['--class' => 'LegacyStorefrontContentSeeder']);

        $product = Product::where('slug', 'poondu-thokku')->first();

        $this->assertNotNull($product);
        $this->assertSame(1, Product::where('slug', 'poondu-thokku')->count());
        $this->assertNotEmpty($product->thumbnail_img);
        $this->assertStringContainsString('garlic', strtolower((string) $product->description));

        $admin = $this->makeAdminUser();
        Sanctum::actingAs($admin);

        $adminResponse = $this->getJson('/api/admin/products');
        $adminProduct = collect($adminResponse->json('data.data'))->firstWhere('slug', 'poondu-thokku');

        $this->assertNotNull($adminProduct);
        $this->assertNotSame(static_asset('assets/img/placeholder.jpg'), $adminProduct['primary_image_url']);
        $this->assertStringContainsString('/uploads/', $adminProduct['primary_image_url']);

        $storefrontList = $this->apiGet('/api/v2/products');
        $storefrontProduct = collect($storefrontList->json('data'))->firstWhere('slug', 'poondu-thokku');

        $this->assertNotNull($storefrontProduct);
        $this->assertStringContainsString('/uploads/', (string) $storefrontProduct['thumbnail_image']);

        $storefrontDetail = $this->apiGet('/api/v2/products/poondu-thokku/0');
        $detail = collect($storefrontDetail->json('data'))->firstWhere('slug', 'poondu-thokku');

        $this->assertNotNull($detail);
        $this->assertStringContainsString('garlic', strtolower((string) $detail['description']));
        $this->assertStringContainsString('/uploads/', (string) $detail['thumbnail_image']);
    }

    /** @test */
    public function legacy_import_seeds_blog_faq_about_and_contact_content(): void
    {
        Artisan::call('db:seed', ['--class' => 'LegacyStorefrontContentSeeder']);

        $faqPage = Page::where('slug', 'faq')->first();
        $aboutPage = Page::where('slug', 'about')->first();
        $contactPage = Page::where('slug', 'contact-us')->first();

        $this->assertNotNull($faqPage);
        $this->assertNotNull($aboutPage);
        $this->assertNotNull($contactPage);
        $this->assertStringContainsString('Our Story', (string) $aboutPage->content);
        $this->assertSame('contact_us_page', $contactPage->type);

        $this->assertDatabaseHas((new BusinessSetting())->getTable(), [
            'type' => 'contact_email',
            'value' => 'dhanvanthrifoods777@gmail.com',
        ]);

        $blogList = $this->apiGet('/api/v2/blog-list');
        $this->assertNotEmpty($blogList->json('blogs.data'));

        $blogPost = collect($blogList->json('blogs.data'))->firstWhere('slug', 'art-of-traditional-pickle-making');
        $this->assertNotNull($blogPost);
        $this->assertStringContainsString('/uploads/', (string) $blogPost['banner']);

        $faqResponse = $this->apiGet('/api/v2/faqs');
        $faq = collect($faqResponse->json('data'))->firstWhere('id', 1);
        $this->assertNotNull($faq);
        $this->assertSame('Products', $faq['category']);

        $aboutResponse = $this->apiGet('/api/v2/pages/about');
        $about = $aboutResponse->json('data');
        $this->assertSame('about', $about['slug']);
        $this->assertStringContainsString('Our Story', (string) $about['content']);

        $contactResponse = $this->apiGet('/api/v2/pages/contact');
        $contact = $contactResponse->json('data');
        $this->assertSame('contact-us', $contact['slug']);
        $this->assertSame('dhanvanthrifoods777@gmail.com', $contact['contact']['email']);
    }

    private function apiGet(string $uri)
    {
        return $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->getJson($uri);
    }

    private function makeAdminUser(): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Admin Tester',
            'email' => 'admin-import-' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $user->save();

        return $user;
    }
}
