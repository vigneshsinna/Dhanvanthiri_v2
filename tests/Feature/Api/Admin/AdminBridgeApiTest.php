<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminBridgeApiTest extends TestCase
{
    public function test_admin_can_list_products_pages_posts_and_faqs(): void
    {
        $admin = $this->makeAdminUser();
        Sanctum::actingAs($admin);

        $page = new Page();
        $page->forceFill([
            'type' => 'custom_page',
            'title' => 'About Us',
            'slug' => 'about-us',
            'content' => '<p>About content</p>',
        ]);
        $page->save();

        $faqPage = new Page();
        $faqPage->forceFill([
            'type' => 'custom_page',
            'title' => 'FAQ',
            'slug' => 'faq',
            'content' => json_encode([
                ['id' => 1, 'question' => 'Shelf life?', 'answer' => '6 months', 'category' => 'General', 'sort_order' => 0, 'is_active' => true],
            ]),
        ]);
        $faqPage->save();

        $category = new BlogCategory();
        $category->forceFill(['category_name' => 'Health', 'slug' => 'health']);
        $category->save();

        $post = new Blog();
        $post->forceFill([
            'category_id' => $category->id,
            'title' => 'Health Benefits',
            'slug' => 'health-benefits',
            'short_description' => 'Short summary',
            'description' => '<p>Body</p>',
            'status' => 1,
        ]);
        $post->save();

        $product = new Product();
        $product->forceFill([
            'name' => 'Poondu Thokku',
            'slug' => 'poondu-thokku',
            'added_by' => 'admin',
            'user_id' => $admin->id,
            'unit_price' => 249,
            'purchase_price' => 180,
            'published' => 1,
            'approved' => 1,
            'current_stock' => 12,
        ]);
        $product->save();

        $stock = new ProductStock();
        $stock->forceFill([
            'product_id' => $product->id,
            'variant' => '',
            'sku' => 'PT-001',
            'price' => 249,
            'qty' => 12,
        ]);
        $stock->save();

        $this->getJson('/api/admin/products')
            ->assertOk()
            ->assertJsonPath('data.data.0.primary_image_url', static_asset('assets/img/placeholder.jpg'))
            ->assertJsonPath('data.data.0.name', 'Poondu Thokku');

        $this->getJson('/api/admin/pages')
            ->assertOk()
            ->assertJsonPath('data.data.0.slug', 'faq');

        $this->getJson('/api/admin/posts')
            ->assertOk()
            ->assertJsonPath('data.data.0.slug', 'health-benefits');

        $faqResponse = $this->getJson('/api/admin/faqs')
            ->assertOk();

        $this->assertNotEmpty($faqResponse->json('data.data'));
    }

    public function test_admin_can_create_and_update_page_post_and_faq(): void
    {
        $admin = $this->makeAdminUser();
        Sanctum::actingAs($admin);

        $pageResponse = $this->postJson('/api/admin/pages', [
            'title' => ['en' => 'About Us', 'ta' => 'எங்களை பற்றி'],
            'slug' => 'about-us',
            'content' => ['en' => '<p>About</p>', 'ta' => '<p>தமிழ்</p>'],
            'meta_title' => ['en' => 'About Dhanvathiri'],
            'meta_description' => ['en' => 'About page'],
        ]);
        $pageResponse->assertOk();
        $this->assertStringStartsWith('about-us', (string) $pageResponse->json('data.slug'));

        $pageId = (int) $pageResponse->json('data.id');
        $this->putJson("/api/admin/pages/{$pageId}", [
            'title' => ['en' => 'About Dhanvathiri'],
        ])->assertOk()->assertJsonPath('data.title', 'About Dhanvathiri');

        $postResponse = $this->postJson('/api/admin/posts', [
            'title' => ['en' => 'Immunity Tips'],
            'excerpt' => ['en' => 'Short excerpt'],
            'body' => ['en' => '<p>Post body</p>'],
            'category' => 'Wellness',
            'status' => 'published',
        ]);
        $postResponse->assertOk()->assertJsonPath('data.status', 'published');

        $postId = (int) $postResponse->json('data.id');
        $this->putJson("/api/admin/posts/{$postId}", [
            'excerpt' => ['en' => 'Updated excerpt'],
        ])->assertOk()->assertJsonPath('data.excerpt', 'Updated excerpt');

        $faqResponse = $this->postJson('/api/admin/faqs', [
            'question' => ['en' => 'How should I store this?'],
            'answer' => ['en' => 'Keep it refrigerated.'],
            'category' => 'Storage',
            'sort_order' => 1,
            'is_active' => true,
        ]);
        $faqResponse->assertOk()->assertJsonPath('data.question', 'How should I store this?');

        $faqId = (int) $faqResponse->json('data.id');
        $this->putJson("/api/admin/faqs/{$faqId}", [
            'answer' => ['en' => 'Store in a cool, dry place.'],
        ])->assertOk()->assertJsonPath('data.answer', 'Store in a cool, dry place.');
    }

    public function test_payment_methods_are_super_admin_only(): void
    {
        $admin = $this->makeAdminUser();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/payment-methods')
            ->assertForbidden();

        $superAdmin = $this->makeAdminUser();
        $role = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->assignRole($role);
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/admin/payment-methods')
            ->assertOk()
            ->assertJsonPath('data.data.0.code', 'razorpay');
    }

    private function makeAdminUser(): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Admin Tester',
            'email' => 'admin' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $user->save();

        return $user;
    }
}
