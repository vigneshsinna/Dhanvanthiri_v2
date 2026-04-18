<?php

namespace Tests\Feature\Api\V2;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Tests\TestCase;

/**
 * Tier 1 Contract Tests — Pre-Step 3 Gate 2
 *
 * These tests verify the API contracts that the React storefront will
 * consume during Step 3. They cover authentication, catalog, cart,
 * checkout, payment, and error handling response shapes.
 *
 * Run all:   php artisan test --filter=Tier1ContractTest
 * Run group: php artisan test --filter=Tier1ContractTest::test_auth
 */
class Tier1ContractTest extends TestCase
{
    // ═══════════════════════════════════════════════════════════
    // A. Authentication Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function auth_login_success_returns_token_and_user()
    {
        // Create a user with known credentials
        $user = factory(User::class)->create([
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/v2/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'result',
                'message',
                'access_token',
                'token_type',
                'user' => ['id', 'type', 'name', 'email', 'avatar', 'phone'],
            ])
            ->assertJson(['result' => true, 'token_type' => 'Bearer']);
    }

    /** @test */
    public function auth_login_wrong_password_returns_failure()
    {
        $user = factory(User::class)->create([
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/v2/auth/login', [
            'email'    => $user->email,
            'password' => 'wrongpassword',
        ]);

        // Legacy controllers return 401 or 200 with result:false
        $response->assertJson(['result' => false]);
    }

    /** @test */
    public function auth_login_empty_body_returns_validation_error()
    {
        $response = $this->postJson('/api/v2/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'error' => ['code', 'fields'],
            ])
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'VALIDATION_ERROR'],
            ]);
    }

    /** @test */
    public function auth_signup_empty_body_returns_validation_error()
    {
        $response = $this->postJson('/api/v2/auth/signup', []);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'VALIDATION_ERROR'],
            ]);
    }

    /** @test */
    public function auth_logout_without_token_returns_401()
    {
        $response = $this->getJson('/api/v2/auth/logout');

        $response->assertStatus(401)
            ->assertJsonStructure([
                'success',
                'message',
                'error' => ['code'],
            ])
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    /** @test */
    public function auth_logout_with_token_returns_success()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v2/auth/logout');

        $response->assertStatus(200)
            ->assertJsonStructure(['result', 'message'])
            ->assertJson(['result' => true]);
    }

    /** @test */
    public function auth_user_endpoint_returns_user_object()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v2/auth/user');

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'name', 'email']);
    }

    /** @test */
    public function auth_user_without_token_returns_401()
    {
        $response = $this->getJson('/api/v2/auth/user');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    /** @test */
    public function auth_profile_counters_requires_auth()
    {
        $response = $this->getJson('/api/v2/profile/counters');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    // ═══════════════════════════════════════════════════════════
    // B. Catalog Listing Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function products_featured_returns_expected_structure()
    {
        $response = $this->getJson('/api/v2/products/featured');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'name',
                        'thumbnail_image',
                        'has_discount',
                        'stroked_price',
                        'main_price',
                        'rating',
                    ],
                ],
            ]);
    }

    /** @test */
    public function products_search_returns_expected_structure()
    {
        $response = $this->getJson('/api/v2/products/search?name=test');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function products_search_supports_pagination()
    {
        $response = $this->getJson('/api/v2/products/search?name=&page=1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    /** @test */
    public function product_detail_returns_expected_fields()
    {
        // Try to get any existing product
        $product = Product::where('published', 1)->first();

        if (!$product) {
            $this->markTestSkipped('No published product in database');
        }

        $response = $this->getJson("/api/v2/products/{$product->slug}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name'],
                ],
            ]);
    }

    /** @test */
    public function products_by_category_returns_expected_structure()
    {
        $category = Category::first();

        if (!$category) {
            $this->markTestSkipped('No category in database');
        }

        $response = $this->getJson("/api/v2/products/category/{$category->slug}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function products_by_brand_returns_expected_structure()
    {
        $brand = Brand::first();

        if (!$brand) {
            $this->markTestSkipped('No brand in database');
        }

        $response = $this->getJson("/api/v2/products/brand/{$brand->slug}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function categories_listing_returns_expected_fields()
    {
        $response = $this->getJson('/api/v2/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name'],
                ],
            ]);
    }

    /** @test */
    public function categories_featured_returns_expected_structure()
    {
        $response = $this->getJson('/api/v2/categories/featured');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function category_info_returns_detail()
    {
        $category = Category::first();

        if (!$category) {
            $this->markTestSkipped('No category in database');
        }

        $response = $this->getJson("/api/v2/category/info/{$category->slug}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name'],
                ],
            ]);
    }

    /** @test */
    public function brands_listing_returns_expected_fields()
    {
        $response = $this->getJson('/api/v2/brands');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'name', 'logo'],
                ],
            ]);
    }

    /** @test */
    public function brands_top_returns_expected_structure()
    {
        $response = $this->getJson('/api/v2/brands/top');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function product_prices_are_formatted_strings()
    {
        $response = $this->getJson('/api/v2/products/featured');
        $response->assertStatus(200);

        $data = $response->json('data');
        if (count($data) > 0) {
            $first = $data[0];
            $this->assertIsString($first['main_price'] ?? '');
            $this->assertIsString($first['stroked_price'] ?? '');
        } else {
            $this->markTestSkipped('No featured products to verify pricing format');
        }
    }

    /** @test */
    public function product_images_are_urls_or_empty()
    {
        $response = $this->getJson('/api/v2/products/featured');
        $response->assertStatus(200);

        $data = $response->json('data');
        if (count($data) > 0) {
            $img = $data[0]['thumbnail_image'] ?? null;
            if ($img) {
                $this->assertStringStartsWith('http', $img);
            }
        } else {
            $this->markTestSkipped('No featured products to verify image format');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // C. Cart Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function cart_add_without_auth_returns_json_envelope()
    {
        $response = $this->postJson('/api/v2/carts/add', [
            'id'       => 1,
            'quantity' => 1,
        ]);

        // Should return JSON regardless of auth state
        $response->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function cart_add_with_auth_returns_result_and_message()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $product = Product::where('published', 1)->first();

        if (!$product) {
            $this->markTestSkipped('No published product for cart test');
        }

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/carts/add', [
                'id'       => $product->id,
                'quantity' => 1,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function cart_summary_returns_totals()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/cart-summary', [
                'user_id' => $user->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'sub_total',
                'tax',
                'shipping_cost',
                'discount',
                'grand_total',
                'grand_total_value',
                'coupon_applied',
            ]);
    }

    /** @test */
    public function cart_summary_for_guest_without_identifiers_returns_zero_totals()
    {
        $response = $this->withHeader('System-Key', env('SYSTEM_KEY'))
            ->postJson('/api/v2/cart-summary', []);

        $response->assertStatus(200)
            ->assertJson([
                'sub_total' => format_price(0.00),
                'tax' => format_price(0.00),
                'shipping_cost' => format_price(0.00),
                'discount' => format_price(0.00),
                'grand_total' => format_price(0.00),
                'grand_total_value' => 0.00,
                'coupon_code' => '',
                'coupon_applied' => false,
            ]);
    }

    /** @test */
    public function cart_list_returns_grouped_data()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/carts', [
                'user_id' => $user->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /** @test */
    public function cart_change_quantity_returns_result()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/carts/change-quantity', [
                'id'       => 0,
                'quantity' => 2,
            ]);

        // Even with invalid cart item, should return JSON structure
        $response->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function cart_destroy_returns_result()
    {
        $response = $this->deleteJson('/api/v2/carts/0');

        // Should return structured JSON even for non-existent item
        $this->assertTrue(
            $response->status() === 200 || $response->status() === 404 || $response->status() === 401,
            "Expected 200, 404, or 401, got {$response->status()}"
        );
    }

    // ═══════════════════════════════════════════════════════════
    // D. Checkout / Shipping Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function shipping_cost_returns_expected_fields()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/shipping_cost', [
                'user_id' => $user->id,
            ]);

        // May fail with business logic error but should be valid JSON
        $response->assertJsonStructure(['result']);
    }

    /** @test */
    public function delivery_info_returns_expected_fields()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/delivery-info', [
                'user_id' => $user->id,
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function coupon_apply_without_code_returns_failure()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/coupon-apply', [
                'user_id' => $user->id,
            ]);

        // Should return result false with message about missing/invalid coupon
        $response->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function coupon_remove_returns_result()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/coupon-remove', [
                'user_id' => $user->id,
            ]);

        $response->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function order_store_without_cart_returns_failure()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/order/store', []);

        // Empty cart should fail gracefully
        $response->assertJsonStructure(['result', 'message']);
    }

    // ═══════════════════════════════════════════════════════════
    // E. Payment Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function payment_types_returns_list()
    {
        $response = $this->getJson('/api/v2/payment-types');

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    /** @test */
    public function payment_cod_without_auth_returns_401()
    {
        $response = $this->postJson('/api/v2/payments/pay/cod', []);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    /** @test */
    public function payment_manual_without_auth_returns_401()
    {
        $response = $this->postJson('/api/v2/payments/pay/manual', []);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    /** @test */
    public function payment_cod_without_cart_returns_failure()
    {
        $user  = factory(User::class)->create();
        $token = $user->createToken('API Token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v2/payments/pay/cod', []);

        // Should fail gracefully — no cart items
        $response->assertJsonStructure(['result', 'message']);
    }

    /** @test */
    public function online_pay_init_without_auth_returns_401()
    {
        $response = $this->getJson('/api/v2/online-pay/init');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    // ═══════════════════════════════════════════════════════════
    // F. Error Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function error_404_returns_standardized_envelope()
    {
        $response = $this->getJson('/api/v2/nonexistent-endpoint-xyz');

        $response->assertStatus(404)
            ->assertJsonStructure([
                'success',
                'message',
                'error' => ['code'],
            ])
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'NOT_FOUND'],
            ]);
    }

    /** @test */
    public function error_401_returns_standardized_envelope()
    {
        $response = $this->getJson('/api/v2/profile/counters');

        $response->assertStatus(401)
            ->assertJsonStructure([
                'success',
                'message',
                'error' => ['code'],
            ])
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'UNAUTHORIZED'],
            ]);
    }

    /** @test */
    public function error_validation_returns_field_details()
    {
        $response = $this->postJson('/api/v2/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'error' => ['code', 'fields'],
            ])
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'VALIDATION_ERROR'],
            ]);

        // Verify fields is an object with field names
        $fields = $response->json('error.fields');
        $this->assertIsArray($fields);
        $this->assertNotEmpty($fields);
    }

    /** @test */
    public function error_validation_signup_shows_required_fields()
    {
        $response = $this->postJson('/api/v2/auth/signup', ['name' => '']);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error'   => ['code' => 'VALIDATION_ERROR'],
            ]);
    }

    /** @test */
    public function error_envelope_always_has_success_field()
    {
        // Test multiple error paths to verify envelope consistency
        $endpoints = [
            ['GET',  '/api/v2/nonexistent-endpoint-xyz', 404],
            ['GET',  '/api/v2/profile/counters', 401],
            ['POST', '/api/v2/auth/login', 422],
        ];

        foreach ($endpoints as [$method, $url, $expectedStatus]) {
            $response = $method === 'GET'
                ? $this->getJson($url)
                : $this->postJson($url, []);

            $response->assertStatus($expectedStatus);
            $this->assertArrayHasKey('success', $response->json(), "Missing 'success' key for {$method} {$url}");
            $this->assertFalse($response->json('success'), "Expected success=false for {$method} {$url}");
            $this->assertArrayHasKey('error', $response->json(), "Missing 'error' key for {$method} {$url}");
            $this->assertArrayHasKey('code', $response->json('error'), "Missing 'error.code' for {$method} {$url}");
        }
    }

    /** @test */
    public function error_codes_are_uppercase_strings()
    {
        // Verify error codes follow the expected format
        $response = $this->getJson('/api/v2/nonexistent-endpoint-xyz');
        $code     = $response->json('error.code');

        $this->assertIsString($code);
        $this->assertMatchesRegularExpression('/^[A-Z_]+$/', $code, "Error code '{$code}' should be UPPER_SNAKE_CASE");
    }

    // ═══════════════════════════════════════════════════════════
    // G. Capability Flags Contract Tests
    // ═══════════════════════════════════════════════════════════

    /** @test */
    public function capabilities_returns_normalized_envelope()
    {
        $response = $this->getJson('/api/v2/capabilities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'multi_vendor',
                    'guest_checkout',
                    'wallet',
                    'loyalty_points',
                    'wishlist',
                    'flash_deals',
                    'coupons',
                    'reviews',
                    'payment_methods',
                    'currency_symbol',
                    'currency_code',
                    'shipping_type',
                ],
            ])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function capabilities_payment_methods_is_array()
    {
        $response = $this->getJson('/api/v2/capabilities');

        $response->assertStatus(200);
        $this->assertIsArray($response->json('data.payment_methods'));
    }

    /** @test */
    public function capabilities_boolean_flags_are_booleans()
    {
        $response = $this->getJson('/api/v2/capabilities');
        $response->assertStatus(200);

        $boolFlags = ['multi_vendor', 'guest_checkout', 'wallet', 'loyalty_points', 'wishlist', 'flash_deals', 'coupons', 'reviews'];
        $data      = $response->json('data');

        foreach ($boolFlags as $flag) {
            $this->assertIsBool($data[$flag], "Capability flag '{$flag}' should be boolean");
        }
    }
}
