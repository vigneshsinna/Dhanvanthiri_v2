<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Resources\V2\StorefrontPageResource;
use App\Mail\ContactMailManager;
use App\Models\BusinessSetting;
use App\Models\Contact;
use App\Models\Currency;
use App\Models\Page;
use App\Support\BusinessContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;

class StorefrontContentController extends Controller
{
    public function settings()
    {
        $currencyId = $this->setting('system_default_currency') ?: $this->setting('home_default_currency');
        $currency = $currencyId ? Currency::find($currencyId) : null;
        $primaryNavigation = $this->buildNavigation(
            $this->decodeJson($this->setting('header_menu_labels'), []),
            $this->decodeJson($this->setting('header_menu_links'), [])
        );

        if (empty($primaryNavigation)) {
            $primaryNavigation = [
                ['label' => 'Products', 'href' => '/products'],
                ['label' => 'Blog', 'href' => '/blog'],
                ['label' => 'FAQ', 'href' => '/faq'],
                ['label' => 'About', 'href' => '/pages/about'],
            ];
        }

        return response()->json([
            'data' => [
                'website' => [
                    'name' => $this->setting('website_name') ?: $this->setting('site_name') ?: config('app.name'),
                    'shortName' => $this->setting('site_name') ?: config('app.name'),
                    'logo' => $this->imageSetting('header_logo'),
                    'footerLogo' => $this->imageSetting('footer_logo') ?: $this->imageSetting('header_logo'),
                    'favicon' => $this->imageSetting('site_icon'),
                    'description' => $this->setting('meta_description') ?: ($this->setting('site_motto') ?: ''),
                    'announcement' => $this->setting('header_announcement') ?: '',
                    'phone' => $this->setting('contact_phone', '', App::getLocale()),
                    'email' => $this->setting('contact_email', '', App::getLocale()),
                    'address' => $this->setting('contact_address', '', App::getLocale()),
                    'footerDescription' => $this->setting('about_us_description', '', App::getLocale()),
                    'footerCopyright' => $this->setting('frontend_copyright_text', '', App::getLocale()),
                    'currency' => $currency->symbol ?? 'Rs.',
                    'currencyCode' => $currency->code ?? 'INR',
                ],
                'navigation' => [
                    'primary' => $primaryNavigation,
                ],
                'social' => [
                    'links' => $this->buildSocialLinks(),
                ],
            ],
            'success' => true,
            'status' => 200,
        ]);
    }

    public function page(string $slug)
    {
        $requestedSlug = $slug;
        $slug = $this->pageAliases()[$slug] ?? $slug;

        $page = Page::where('slug', $slug)->first();
        if (!$page) {
            return response()->json([
                'data' => null,
                'success' => false,
                'status' => 404,
                'message' => 'Page not found',
            ], 404);
        }

        $payload = (new StorefrontPageResource($page))->resolve(request());
        $payload['requested_slug'] = $requestedSlug;

        return response()->json([
            'data' => $payload,
            'success' => true,
            'status' => 200,
        ]);
    }

    public function faqs()
    {
        $page = Page::where('slug', 'faq')->first();
        $content = $page ? $page->getTranslation('content') : null;
        $decoded = json_decode((string) $content, true);

        $items = collect(is_array($decoded) ? $decoded : [])
            ->filter(function ($item) {
                return is_array($item) && ($item['is_active'] ?? true);
            })
            ->sortBy(fn ($item) => (int) ($item['sort_order'] ?? 0))
            ->values()
            ->map(function ($item, $index) {
                return [
                    'id' => (int) ($item['id'] ?? ($index + 1)),
                    'question' => (string) ($item['question'] ?? ''),
                    'answer' => (string) ($item['answer'] ?? ''),
                    'category' => (string) ($item['category'] ?? 'General'),
                    'sort_order' => (int) ($item['sort_order'] ?? 0),
                    'is_active' => (bool) ($item['is_active'] ?? true),
                ];
            });

        return response()->json([
            'data' => $items,
            'success' => true,
            'status' => 200,
        ]);
    }

    public function contact(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $recipientEmail = BusinessContact::email();
        if (!$recipientEmail) {
            return response()->json([
                'result' => false,
                'message' => 'No business contact email configured',
            ], 500);
        }

        $mailPayload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '',
            'content' => str_replace("\n", '<br>', $validated['message']),
            'subject' => $validated['subject'] ?: translate('Query Contact'),
            'from' => $validated['email'],
        ];

        try {
            Mail::to($recipientEmail)->queue(new ContactMailManager($mailPayload));

            Contact::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? '',
                'content' => $validated['message'],
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'result' => false,
                'message' => 'Something Went wrong',
            ], 500);
        }

        return response()->json([
            'result' => true,
            'message' => 'Query has been sent successfully',
        ]);
    }

    private function setting(string $key, $default = null, $lang = false)
    {
        $query = BusinessSetting::query()->where('type', $key);

        if ($lang) {
            $localized = (clone $query)->where('lang', $lang)->first();
            if ($localized) {
                return $localized->value;
            }
        }

        $setting = $query->first();

        return $setting ? $setting->value : $default;
    }

    private function imageSetting(string $key): string
    {
        $value = $this->setting($key);

        return $value ? uploaded_asset($value) : '';
    }

    private function decodeJson($value, array $default): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || trim($value) === '') {
            return $default;
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : $default;
    }

    private function buildNavigation(array $labels, array $links): array
    {
        $navigation = [];

        foreach ($labels as $index => $label) {
            $label = trim((string) $label);
            $href = trim((string) ($links[$index] ?? ''));

            if ($label === '' || $href === '') {
                continue;
            }

            $navigation[] = [
                'label' => $label,
                'href' => $this->normalizeHref($href),
            ];
        }

        return $navigation;
    }

    private function buildSocialLinks(): array
    {
        if ($this->setting('show_social_links') !== 'on') {
            return [];
        }

        $platforms = [
            'facebook' => 'facebook_link',
            'instagram' => 'instagram_link',
            'youtube' => 'youtube_link',
            'linkedin' => 'linkedin_link',
            'twitter' => 'twitter_link',
        ];

        $links = [];

        foreach ($platforms as $platform => $settingKey) {
            $url = trim((string) $this->setting($settingKey, ''));

            if ($url === '') {
                continue;
            }

            $links[] = [
                'platform' => $platform,
                'url' => $url,
                'is_active' => true,
            ];
        }

        return $links;
    }

    private function normalizeHref(string $href): string
    {
        if (!preg_match('/^https?:\/\//i', $href)) {
            return str_starts_with($href, '/') ? $href : '/' . ltrim($href, '/');
        }

        $parts = parse_url($href);
        $path = $parts['path'] ?? '/';
        $query = isset($parts['query']) ? '?' . $parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

        return $path . $query . $fragment;
    }

    private function pageAliases(): array
    {
        return [
            'contact' => 'contact-us',
            'return-policy' => 'refund-policy',
            'terms-and-conditions' => 'terms',
        ];
    }
}
