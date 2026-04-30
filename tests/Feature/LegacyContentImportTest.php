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
        require_once database_path('seeders/DhanvathiriProductsSeeder.php');

        Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DhanvathiriProductsSeeder']);
        Artisan::call('db:seed', ['--class' => 'LegacyStorefrontContentSeeder']);
        Artisan::call('db:seed', ['--class' => 'LegacyStorefrontContentSeeder']);

        $product = Product::where('slug', 'poondu-thokku')->first();

        $this->assertNotNull($product);
        $this->assertSame(1, Product::where('slug', 'poondu-thokku')->count());
        $this->assertNotEmpty($product->thumbnail_img);
        $this->assertStringContainsString('garlic', strtolower((string) $product->description));

        $admin = $this->makeAdminUser();
        Sanctum::actingAs($admin);

        $adminResponse = $this->getJson('/api/admin/products?per_page=100');
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
        $this->assertNotNull($blogPost['published_at']);

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

        $refundResponse = $this->apiGet('/api/v2/pages/refund-policy');
        $refundResponse->assertJsonPath('data.slug', 'refund-policy');
    }

    /** @test */
    public function default_database_seeder_copies_storefront_shell_and_content_into_admin_owned_tables(): void
    {
        Artisan::call('db:seed');

        $this->assertDatabaseHas((new BusinessSetting())->getTable(), [
            'type' => 'website_name',
            'value' => 'Dhanvanthiri Foods',
        ]);

        $this->assertDatabaseHas((new BusinessSetting())->getTable(), [
            'type' => 'header_announcement',
            'value' => 'Free shipping on orders above Rs.499 | Freshly handmade with love',
        ]);

        $this->assertDatabaseHas((new BusinessSetting())->getTable(), [
            'type' => 'about_us_description',
            'value' => 'Traditional South Indian pickles and thokku, handcrafted with authentic family recipes passed down through generations.',
        ]);

        $this->assertNotNull(Page::where('slug', 'about')->first());
        $this->assertNotNull(Page::where('slug', 'faq')->first());
        $this->assertNotNull(Page::where('slug', 'contact-us')->first());

        $blogList = $this->apiGet('/api/v2/blog-list');
        $this->assertNotEmpty($blogList->json('blogs.data'));
        $this->assertNotNull($blogList->json('blogs.data.0.published_at'));

        $settings = $this->apiGet('/api/v2/storefront/settings');
        $settings->assertJsonPath('data.website.name', 'Dhanvanthiri Foods')
            ->assertJsonPath('data.website.announcement', 'Free shipping on orders above Rs.499 | Freshly handmade with love')
            ->assertJsonPath('data.website.footerDescription', 'Traditional South Indian pickles and thokku, handcrafted with authentic family recipes passed down through generations.')
            ->assertJsonPath('data.navigation.primary.0.label', 'Products')
            ->assertJsonPath('data.navigation.primary.1.label', 'Blog')
            ->assertJsonPath('data.navigation.primary.2.label', 'FAQ')
            ->assertJsonPath('data.navigation.primary.3.label', 'About');

        $contact = $this->apiGet('/api/v2/pages/contact');
        $contact->assertJsonPath('data.slug', 'contact-us')
            ->assertJsonPath('data.contact.email', 'dhanvanthrifoods777@gmail.com');

        $product = Product::where('slug', 'karuveppilai-thokku')->first();
        $this->assertNotNull($product);
        $this->assertNotEmpty($product->thumbnail_img);

        $refundResponse = $this->apiGet('/api/v2/pages/refund-policy');
        $refundResponse->assertJsonPath('data.slug', 'refund-policy');
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
