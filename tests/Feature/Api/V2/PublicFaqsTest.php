<?php

namespace Tests\Feature\Api\V2;

use App\Models\Page;
use Tests\TestCase;

class PublicFaqsTest extends TestCase
{
    private const SYSTEM_KEY = '0d279f87add587c1c6d046cd59ee012d';

    /** @test */
    public function public_faq_endpoint_returns_faq_items_from_the_faq_page_content()
    {
        $page = Page::where('slug', 'faq')->first() ?? new Page();
        $page->forceFill([
            'title' => 'FAQ',
            'slug' => 'faq',
            'type' => 'custom_page',
            'content' => json_encode([
                [
                    'id' => 1,
                    'question' => 'How long does shipping take?',
                    'answer' => 'Usually 3 to 5 business days.',
                    'category' => 'Shipping',
                    'sort_order' => 1,
                    'is_active' => true,
                ],
                [
                    'id' => 2,
                    'question' => 'How should I store thokku?',
                    'answer' => 'Store in a cool, dry place.',
                    'category' => 'Products',
                    'sort_order' => 2,
                    'is_active' => false,
                ],
            ]),
        ])->save();

        $response = $this->withHeaders([
            'System-Key' => self::SYSTEM_KEY,
            'Accept' => 'application/json',
        ])->getJson('/api/v2/faqs');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.question', 'How long does shipping take?')
            ->assertJsonPath('data.0.answer', 'Usually 3 to 5 business days.')
            ->assertJsonPath('data.0.category', 'Shipping')
            ->assertJsonPath('data.0.sort_order', 1)
            ->assertJsonPath('data.0.is_active', true);
    }
}
