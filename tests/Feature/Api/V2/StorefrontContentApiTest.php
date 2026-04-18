<?php

namespace Tests\Feature\Api\V2;

use App\Mail\ContactMailManager;
use App\Models\BusinessSetting;
use App\Models\Contact;
use App\Models\Page;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class StorefrontContentApiTest extends TestCase
{
    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    /** @test */
    public function storefront_settings_endpoint_returns_normalized_shell_data()
    {
        $this->upsertBusinessSetting('site_name', 'Admin Store');
        $this->upsertBusinessSetting('website_name', 'Admin Storefront');
        $this->upsertBusinessSetting('contact_email', 'support@example.test');
        $this->upsertBusinessSetting('contact_phone', '+91 90000 00000');
        $this->upsertBusinessSetting('contact_address', '42 Market Street');
        $this->upsertBusinessSetting('header_menu_labels', json_encode(['Catalog', 'Journal']));
        $this->upsertBusinessSetting('header_menu_links', json_encode(['/products', '/blog']));
        $this->upsertBusinessSetting('frontend_copyright_text', 'Admin managed copyright');

        $response = $this->apiRequest('GET', '/api/v2/storefront/settings');

        $response->assertStatus(200)
            ->assertJsonPath('data.website.name', 'Admin Storefront')
            ->assertJsonPath('data.website.email', 'support@example.test')
            ->assertJsonPath('data.website.phone', '+91 90000 00000')
            ->assertJsonPath('data.website.address', '42 Market Street')
            ->assertJsonPath('data.website.footerCopyright', 'Admin managed copyright')
            ->assertJsonPath('data.navigation.primary.0.label', 'Catalog')
            ->assertJsonPath('data.navigation.primary.0.href', '/products')
            ->assertJsonPath('data.navigation.primary.1.label', 'Journal')
            ->assertJsonPath('data.navigation.primary.1.href', '/blog');
    }

    /** @test */
    public function page_endpoint_returns_custom_pages_by_slug()
    {
        $slug = 'about-' . Str::lower(Str::random(8));

        tap(new Page(), function (Page $page) use ($slug) {
            $page->forceFill([
            'title' => 'About Our Store',
            'slug' => $slug,
            'type' => 'custom_page',
            'content' => '<p>Admin managed about page.</p>',
            'meta_title' => 'About Meta',
            'meta_description' => 'About Description',
            ])->save();
        });

        $response = $this->apiRequest('GET', "/api/v2/pages/{$slug}");

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', $slug)
            ->assertJsonPath('data.title', 'About Our Store')
            ->assertJsonPath('data.content', '<p>Admin managed about page.</p>')
            ->assertJsonPath('data.meta_title', 'About Meta')
            ->assertJsonPath('data.meta_description', 'About Description');
    }

    /** @test */
    public function page_endpoint_maps_contact_alias_to_contact_us_page()
    {
        $page = Page::firstOrNew(['slug' => 'contact-us']);
        $page->forceFill(
            [
                'title' => 'Contact Us',
                'type' => 'contact_us_page',
                'content' => json_encode([
                    'description' => 'Reach our admin-managed support team.',
                    'address' => '12 Temple Road',
                    'phone' => '+91 81234 56789',
                    'email' => 'care@example.test',
                ]),
                'meta_title' => 'Contact Meta',
                'meta_description' => 'Contact Description',
            ]
        )->save();

        $response = $this->apiRequest('GET', '/api/v2/pages/contact');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'contact-us')
            ->assertJsonPath('data.requested_slug', 'contact')
            ->assertJsonPath('data.title', 'Contact Us')
            ->assertJsonPath('data.content', 'Reach our admin-managed support team.')
            ->assertJsonPath('data.contact.address', '12 Temple Road')
            ->assertJsonPath('data.contact.phone', '+91 81234 56789')
            ->assertJsonPath('data.contact.email', 'care@example.test');
    }

    /** @test */
    public function contact_endpoint_accepts_storefront_message_payload_and_creates_contact()
    {
        $admin = User::firstOrNew(['email' => 'admin@example.test']);
        $admin->forceFill([
            'name' => 'Admin User',
            'user_type' => 'admin',
            'password' => bcrypt('secret123'),
            'email_verified_at' => now(),
        ])->save();

        Mail::fake();

        $response = $this->apiRequest('POST', '/api/v2/contact', [
            'name' => 'Customer Name',
            'email' => 'customer@example.test',
            'phone' => '+91 98765 43210',
            'subject' => 'Need help',
            'message' => 'Please call me back.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'result' => true,
                'message' => 'Query has been sent successfully',
            ]);

        $this->assertDatabaseHas((new Contact())->getTable(), [
            'name' => 'Customer Name',
            'email' => 'customer@example.test',
            'phone' => '+91 98765 43210',
            'content' => 'Please call me back.',
        ]);

        Mail::assertQueued(ContactMailManager::class);
    }

    private function upsertBusinessSetting(string $type, $value): void
    {
        $setting = BusinessSetting::firstOrNew(['type' => $type]);
        $setting->forceFill(['value' => $value]);
        $setting->save();
    }

    private function apiRequest(string $method, string $uri, array $payload = [])
    {
        $request = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ]);

        return match ($method) {
            'POST' => $request->postJson($uri, $payload),
            default => $request->getJson($uri),
        };
    }
}
