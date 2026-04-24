<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Upload;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Razorpay\Api\Api;

class AdminBridgeController extends Controller
{
    public function productsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        $search = trim((string) $request->input('search', ''));

        $query = Product::query()
            ->with(['main_category', 'stocks'])
            ->where('added_by', 'admin')
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $products->getCollection()->map(fn (Product $product) => $this->serializeProductSummary($product))->values(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
            ],
        ]);
    }

    public function productsShow(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $product = Product::with(['main_category', 'stocks'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $this->serializeProductDetail($product),
            ],
        ]);
    }

    public function productsStore(Request $request): JsonResponse
    {
        $user = $this->ensureAdmin($request);
        $payload = $this->validateProduct($request);

        $thumbnailId = $this->storeProductThumbnail($request, $user);
        if ($thumbnailId !== null) {
            $payload['thumbnail_img'] = $thumbnailId;
        }

        $product = DB::transaction(function () use ($payload, $user) {
            $product = new Product();
            $product->forceFill($this->productAttributesFromPayload($payload, $user));
            $product->save();

            $this->upsertPrimaryStock($product, $payload);

            return $product->fresh(['main_category', 'stocks']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Product created',
            'data' => $this->serializeProductDetail($product),
        ]);
    }

    public function productsUpdate(Request $request, int $id): JsonResponse
    {
        $user = $this->ensureAdmin($request);
        $payload = $this->validateProduct($request, true);
        $product = Product::with('stocks')->findOrFail($id);

        $thumbnailId = $this->storeProductThumbnail($request, $user);
        if ($thumbnailId !== null) {
            $payload['thumbnail_img'] = $thumbnailId;
        }

        $product = DB::transaction(function () use ($product, $payload, $user) {
            $product->forceFill($this->productAttributesFromPayload($payload, $user, $product));
            $product->save();

            $this->upsertPrimaryStock($product, $payload);

            return $product->fresh(['main_category', 'stocks']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Product updated',
            'data' => $this->serializeProductDetail($product),
        ]);
    }

    public function productsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        DB::transaction(function () use ($id) {
            $product = Product::with('stocks')->findOrFail($id);
            $product->stocks()->delete();
            $product->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Product deleted',
        ]);
    }

    public function productsDuplicate(Request $request, int $id): JsonResponse
    {
        $user = $this->ensureAdmin($request);
        $source = Product::with('stocks')->findOrFail($id);

        $duplicate = DB::transaction(function () use ($source, $user) {
            $copy = $source->replicate();
            $copy->slug = $this->uniqueSlug($source->slug . '-copy');
            $copy->name = $source->name . ' Copy';
            $copy->user_id = $user->id;
            $copy->save();

            foreach ($source->stocks as $stock) {
                $copy->stocks()->create([
                    'variant' => $stock->variant,
                    'sku' => $stock->sku ? $stock->sku . '-COPY' : null,
                    'price' => $stock->price,
                    'qty' => $stock->qty,
                    'image' => $stock->image,
                ]);
            }

            return $copy->fresh(['main_category', 'stocks']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Product duplicated',
            'data' => $this->serializeProductDetail($duplicate),
        ]);
    }

    public function pagesIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $pages = Page::with('page_translations')->latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $pages->map(fn (Page $page) => $this->serializePage($page))->values(),
            ],
        ]);
    }

    public function pagesStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validatePage($request);

        $page = DB::transaction(function () use ($payload) {
            $page = new Page();
            $page->forceFill([
                'type' => 'custom_page',
                'title' => $payload['title']['en'] ?? '',
                'slug' => $this->uniquePageSlug($payload['slug'] ?: Str::slug($payload['title']['en'] ?? 'page')),
                'content' => $payload['content']['en'] ?? '',
                'meta_title' => $payload['meta_title']['en'] ?? null,
                'meta_description' => $payload['meta_description']['en'] ?? null,
            ]);
            $page->save();

            $this->syncPageTranslations($page, $payload);

            return $page->fresh('page_translations');
        });

        return response()->json([
            'success' => true,
            'message' => 'Page created',
            'data' => $this->serializePage($page),
        ]);
    }

    public function pagesUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validatePage($request, true);
        $page = Page::with('page_translations')->findOrFail($id);

        $page = DB::transaction(function () use ($page, $payload) {
            $page->forceFill([
                'title' => $payload['title']['en'] ?? $page->title,
                'slug' => isset($payload['slug']) && $payload['slug'] !== '' ? $this->uniquePageSlug($payload['slug'], $page->id) : $page->slug,
                'content' => $payload['content']['en'] ?? $page->content,
                'meta_title' => $payload['meta_title']['en'] ?? $page->meta_title,
                'meta_description' => $payload['meta_description']['en'] ?? $page->meta_description,
            ]);
            $page->save();

            $this->syncPageTranslations($page, $payload);

            return $page->fresh('page_translations');
        });

        return response()->json([
            'success' => true,
            'message' => 'Page updated',
            'data' => $this->serializePage($page),
        ]);
    }

    public function pagesDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        DB::transaction(function () use ($id) {
            $page = Page::findOrFail($id);
            PageTranslation::where('page_id', $page->id)->delete();
            $page->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Page deleted',
        ]);
    }

    public function postsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        $posts = Blog::with('category')->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $posts->getCollection()->map(fn (Blog $post) => $this->serializePost($post))->values(),
                'meta' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                ],
            ],
        ]);
    }

    public function postsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validatePost($request);

        $post = DB::transaction(function () use ($payload) {
            $post = new Blog();
            $post->forceFill($this->blogAttributesFromPayload($payload));
            $post->save();

            return $post->fresh('category');
        });

        return response()->json([
            'success' => true,
            'message' => 'Post created',
            'data' => $this->serializePost($post),
        ]);
    }

    public function postsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validatePost($request, true);
        $post = Blog::findOrFail($id);

        $post = DB::transaction(function () use ($post, $payload) {
            $post->forceFill($this->blogAttributesFromPayload($payload, $post));
            $post->save();

            return $post->fresh('category');
        });

        return response()->json([
            'success' => true,
            'message' => 'Post updated',
            'data' => $this->serializePost($post),
        ]);
    }

    public function postsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        Blog::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted',
        ]);
    }

    public function faqsIndex(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $this->faqItems()->values(),
            ],
        ]);
    }

    public function faqsStore(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validateFaq($request);

        $items = $this->faqItems();
        $nextId = ((int) $items->max('id')) + 1;
        $faq = $this->normalizeFaqPayload($payload, $nextId);

        $items->push($faq);
        $this->persistFaqItems($items);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created',
            'data' => $faq,
        ]);
    }

    public function faqsUpdate(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $this->validateFaq($request, true);
        $items = $this->faqItems();
        $index = $items->search(fn (array $item) => (int) $item['id'] === $id);

        abort_if($index === false, 404, 'FAQ not found');

        $current = $items->get($index);
        $updated = $this->normalizeFaqPayload(array_merge($current, $payload), $id);
        $items->put($index, $updated);
        $this->persistFaqItems($items);

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated',
            'data' => $updated,
        ]);
    }

    public function faqsDestroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $items = $this->faqItems()
            ->reject(fn (array $item) => (int) $item['id'] === $id)
            ->values();

        $this->persistFaqItems($items);

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted',
        ]);
    }

    public function paymentMethods(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $enabled = $this->razorpayConfigured() || (int) get_setting('razorpay') === 1;

        return response()->json([
            'success' => true,
            'data' => [
                'data' => [
                    [
                        'code' => 'razorpay',
                        'name' => 'Razorpay (Online Payment)',
                        'description' => 'UPI, cards, net banking, wallets via Razorpay.',
                        'is_enabled' => $enabled,
                        'is_default' => true,
                        'type' => 'online',
                        'can_toggle' => false,
                    ],
                ],
            ],
        ]);
    }

    public function razorpayHealth(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $keyId = (string) env('RAZOR_KEY', '');
        $keySecret = (string) env('RAZOR_SECRET', '');
        $hasKeyId = $keyId !== '';
        $hasKeySecret = $keySecret !== '';
        $hasWebhookSecret = (string) env('RAZOR_WEBHOOK_SECRET', '') !== '';

        if (!$hasKeyId || !$hasKeySecret) {
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [
                        'status' => 'failed',
                        'message' => 'Razorpay credentials are missing.',
                        'has_key_id' => $hasKeyId,
                        'has_key_secret' => $hasKeySecret,
                        'has_webhook_secret' => $hasWebhookSecret,
                    ],
                ],
            ]);
        }

        try {
            $api = new Api($keyId, $keySecret);
            $order = $api->order->create([
                'receipt' => 'health-' . now()->timestamp,
                'amount' => 100,
                'currency' => 'INR',
                'notes' => ['source' => 'admin_health_check'],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [
                        'status' => 'healthy',
                        'http_status' => 200,
                        'message' => 'Razorpay API is reachable and credentials are valid.',
                        'has_key_id' => true,
                        'has_key_secret' => true,
                        'has_webhook_secret' => $hasWebhookSecret,
                        'key_id_prefix' => substr($keyId, 0, 8) . '...',
                        'probe_order_id' => $order['id'] ?? null,
                    ],
                ],
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [
                        'status' => 'failed',
                        'message' => 'Could not verify Razorpay connectivity.',
                        'error' => $exception->getMessage(),
                        'has_key_id' => true,
                        'has_key_secret' => true,
                        'has_webhook_secret' => $hasWebhookSecret,
                    ],
                ],
            ]);
        }
    }

    private function validateProduct(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer'],
            'brand_id' => ['nullable', 'integer'],
            'price' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'thumbnail' => ['nullable', 'image', 'max:5120'],
        ]);
    }

    private function validatePage(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'title' => [$partial ? 'sometimes' : 'required', 'array'],
            'title.en' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'title.ta' => ['nullable', 'string', 'max:255'],
            'slug' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'array'],
            'content.en' => ['nullable', 'string'],
            'content.ta' => ['nullable', 'string'],
            'meta_title' => ['sometimes', 'array'],
            'meta_title.en' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'array'],
            'meta_description.en' => ['nullable', 'string'],
        ]);
    }

    private function validatePost(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'title' => [$partial ? 'sometimes' : 'required', 'array'],
            'title.en' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['sometimes', 'array'],
            'excerpt.en' => ['nullable', 'string'],
            'body' => ['sometimes', 'array'],
            'body.en' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,published'],
        ]);
    }

    private function validateFaq(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'question' => [$partial ? 'sometimes' : 'required', 'array'],
            'question.en' => [$partial ? 'sometimes' : 'required', 'string'],
            'answer' => [$partial ? 'sometimes' : 'required', 'array'],
            'answer.en' => [$partial ? 'sometimes' : 'required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function storeProductThumbnail(Request $request, User $user): ?int
    {
        if (!$request->hasFile('thumbnail') || !$request->file('thumbnail')->isValid()) {
            return null;
        }

        $file = $request->file('thumbnail');
        $path = $file->store('uploads/all', 'local');

        $upload = new Upload();
        $upload->file_original_name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $upload->extension = strtolower($file->getClientOriginalExtension());
        $upload->file_name = $path;
        $upload->user_id = $user->id;
        $upload->type = 'image';
        $upload->file_size = $file->getSize();
        $upload->save();

        return $upload->id;
    }

    private function productAttributesFromPayload(array $payload, User $user, ?Product $product = null): array
    {
        $status = $payload['status'] ?? $this->productStatus($product);
        $stockQuantity = array_key_exists('stock_quantity', $payload)
            ? (int) $payload['stock_quantity']
            : (int) ($product?->current_stock ?? 0);

        return [
            'name' => $payload['name'] ?? $product?->name,
            'slug' => isset($payload['slug']) && $payload['slug'] !== ''
                ? $this->uniqueSlug($payload['slug'], $product?->id)
                : ($product?->slug ?? $this->uniqueSlug(Str::slug((string) ($payload['name'] ?? 'product')))),
            'added_by' => 'admin',
            'user_id' => $user->id,
            'category_id' => $payload['category_id'] ?? $product?->category_id,
            'brand_id' => $payload['brand_id'] ?? $product?->brand_id,
            'description' => $payload['description'] ?? $product?->description,
            'unit_price' => $payload['price'] ?? $product?->unit_price ?? 0,
            'purchase_price' => $payload['cost_price'] ?? $product?->purchase_price ?? 0,
            'published' => $status === 'active' ? 1 : 0,
            'draft' => $status === 'draft' ? 1 : 0,
            'approved' => 1,
            'cash_on_delivery' => 1,
            'current_stock' => $stockQuantity,
            'weight' => $payload['weight'] ?? $product?->weight,
            'low_stock_quantity' => $payload['low_stock_threshold'] ?? $product?->low_stock_quantity ?? 5,
            'meta_title' => $payload['meta_title'] ?? $product?->meta_title,
            'meta_description' => $payload['meta_description'] ?? $product?->meta_description,
            'thumbnail_img' => $payload['thumbnail_img'] ?? $product?->thumbnail_img,
        ];
    }

    private function upsertPrimaryStock(Product $product, array $payload): void
    {
        $stock = $product->stocks()->first() ?: new ProductStock(['product_id' => $product->id]);
        $stock->product_id = $product->id;
        $stock->variant = $stock->variant ?? '';
        $stock->sku = $payload['sku'] ?? $stock->sku ?? ('SKU-' . $product->id);
        $stock->price = $payload['price'] ?? $stock->price ?? $product->unit_price;
        $stock->qty = array_key_exists('stock_quantity', $payload) ? (int) $payload['stock_quantity'] : ($stock->qty ?? 0);
        $stock->save();
    }

    private function serializeProductSummary(Product $product): array
    {
        $image = $this->productImageUrl($product);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'price' => (float) $product->unit_price,
            'status' => $this->productStatus($product),
            'primary_image_url' => $image,
            'variants' => $product->stocks->map(fn (ProductStock $stock) => [
                'id' => $stock->id,
                'stock_quantity' => (int) $stock->qty,
                'sku' => $stock->sku,
            ])->values(),
            'category' => $product->main_category ? ['name' => $product->main_category->name] : null,
            'created_at' => optional($product->created_at)->toISOString(),
        ];
    }

    private function serializeProductDetail(Product $product): array
    {
        $primaryStock = $product->stocks->first();
        $image = $this->productImageUrl($product);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $primaryStock?->sku,
            'category_id' => $product->category_id,
            'brand_id' => $product->brand_id,
            'price' => (float) $product->unit_price,
            'compare_price' => null,
            'cost_price' => (float) $product->purchase_price,
            'short_description' => '',
            'description' => (string) $product->description,
            'status' => $this->productStatus($product),
            'weight' => $product->weight,
            'stock_quantity' => (int) ($primaryStock?->qty ?? $product->current_stock ?? 0),
            'low_stock_threshold' => (int) ($product->low_stock_quantity ?? 0),
            'meta_title' => $product->meta_title,
            'meta_description' => $product->meta_description,
            'primary_image_url' => $image,
            'custom_labels' => [],
        ];
    }

    private function productStatus(?Product $product): string
    {
        if (!$product) {
            return 'draft';
        }

        if ((int) $product->published === 1) {
            return 'active';
        }

        if ((int) $product->draft === 1) {
            return 'draft';
        }

        return 'archived';
    }

    private function serializePage(Page $page): array
    {
        $translations = $page->page_translations
            ->mapWithKeys(fn (PageTranslation $translation) => [$translation->lang => [
                'title' => $translation->title,
                'content' => $translation->content,
            ]]);

        return [
            'id' => $page->id,
            'title' => $page->title,
            'title_translations' => $translations->mapWithKeys(fn (array $value, string $lang) => [$lang => $value['title']])->all(),
            'slug' => $page->slug,
            'content' => $page->content,
            'content_translations' => $translations->mapWithKeys(fn (array $value, string $lang) => [$lang => $value['content']])->all(),
            'excerpt' => null,
            'effective_date' => null,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'status' => 'published',
            'updated_at' => optional($page->updated_at)->toISOString(),
        ];
    }

    private function syncPageTranslations(Page $page, array $payload): void
    {
        foreach (['en', 'ta'] as $lang) {
            $title = $payload['title'][$lang] ?? null;
            $content = $payload['content'][$lang] ?? null;

            if ($lang === 'en') {
                continue;
            }

            if (($title === null || $title === '') && ($content === null || $content === '')) {
                PageTranslation::where('page_id', $page->id)->where('lang', $lang)->delete();
                continue;
            }

            PageTranslation::updateOrCreate(
                ['page_id' => $page->id, 'lang' => $lang],
                ['title' => $title ?: $page->title, 'content' => $content ?: $page->content]
            );
        }
    }

    private function serializePost(Blog $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'title_translations' => ['en' => $post->title],
            'slug' => $post->slug,
            'category' => $post->category?->category_name,
            'status' => (int) $post->status === 1 ? 'published' : 'draft',
            'excerpt' => $post->short_description,
            'excerpt_translations' => ['en' => $post->short_description],
            'body' => $post->description,
            'content_translations' => ['en' => $post->description],
            'published_at' => (int) $post->status === 1 ? optional($post->created_at)->toDateString() : null,
            'updated_at' => optional($post->updated_at)->toISOString(),
            'featured_image_url' => uploaded_asset($post->banner),
        ];
    }

    private function blogAttributesFromPayload(array $payload, ?Blog $post = null): array
    {
        $categoryName = trim((string) ($payload['category'] ?? $post?->category?->category_name ?? 'General'));
        $category = BlogCategory::where('slug', Str::slug($categoryName))->first();
        if (!$category) {
            $category = new BlogCategory();
            $category->forceFill([
                'category_name' => $categoryName,
                'slug' => Str::slug($categoryName),
            ]);
            $category->save();
        }

        return [
            'title' => $payload['title']['en'] ?? $post?->title,
            'slug' => isset($payload['slug']) && $payload['slug'] !== ''
                ? $this->uniqueBlogSlug($payload['slug'], $post?->id)
                : ($post?->slug ?? $this->uniqueBlogSlug(Str::slug((string) ($payload['title']['en'] ?? 'post')))),
            'short_description' => $payload['excerpt']['en'] ?? $post?->short_description,
            'description' => $payload['body']['en'] ?? $post?->description,
            'category_id' => $category->id,
            'status' => ($payload['status'] ?? ((int) $post?->status === 1 ? 'published' : 'draft')) === 'published' ? 1 : 0,
        ];
    }

    private function faqItems()
    {
        $page = Page::where('slug', 'faq')->first();
        $decoded = json_decode((string) ($page?->content ?? '[]'), true);

        return collect(is_array($decoded) ? $decoded : [])
            ->map(function (array $item, int $index) {
                return [
                    'id' => (int) ($item['id'] ?? ($index + 1)),
                    'question' => (string) ($item['question'] ?? ''),
                    'answer' => (string) ($item['answer'] ?? ''),
                    'question_translations' => $item['question_translations'] ?? ['en' => (string) ($item['question'] ?? '')],
                    'answer_translations' => $item['answer_translations'] ?? ['en' => (string) ($item['answer'] ?? '')],
                    'category' => (string) ($item['category'] ?? 'General'),
                    'sort_order' => (int) ($item['sort_order'] ?? 0),
                    'is_active' => (bool) ($item['is_active'] ?? true),
                ];
            })
            ->sortBy('sort_order')
            ->values();
    }

    private function persistFaqItems($items): void
    {
        $page = Page::where('slug', 'faq')->first();
        if (!$page) {
            $page = new Page();
            $page->forceFill([
                'type' => 'custom_page',
                'title' => 'FAQ',
                'slug' => 'faq',
                'content' => '[]',
            ]);
        }

        $page->content = $items->values()->toJson(JSON_UNESCAPED_UNICODE);
        $page->save();
    }

    private function normalizeFaqPayload(array $payload, int $id): array
    {
        $questionTranslations = $payload['question_translations'] ?? null;
        $answerTranslations = $payload['answer_translations'] ?? null;

        if (isset($payload['question']) && is_array($payload['question'])) {
            $questionTranslations = is_array($payload['question']) ? $payload['question'] : ['en' => $payload['question']];
        }

        if (isset($payload['answer']) && is_array($payload['answer'])) {
            $answerTranslations = is_array($payload['answer']) ? $payload['answer'] : ['en' => $payload['answer']];
        }

        $questionTranslations = is_array($questionTranslations) ? $questionTranslations : ['en' => ''];
        $answerTranslations = is_array($answerTranslations) ? $answerTranslations : ['en' => ''];

        return [
            'id' => $id,
            'question' => (string) ($questionTranslations['en'] ?? $payload['question'] ?? ''),
            'answer' => (string) ($answerTranslations['en'] ?? $payload['answer'] ?? ''),
            'question_translations' => $questionTranslations,
            'answer_translations' => $answerTranslations,
            'category' => (string) ($payload['category'] ?? 'General'),
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
            'is_active' => array_key_exists('is_active', $payload) ? (bool) $payload['is_active'] : true,
        ];
    }

    private function ensureAdmin(Request $request): User
    {
        $user = $request->user();
        if (!$user) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401));
        }

        if (!in_array($user->user_type, ['admin', 'staff'], true)) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403));
        }

        return $user;
    }

    private function ensureSuperAdmin(Request $request): User
    {
        $user = $this->ensureAdmin($request);
        if (!$user->hasRole('Super Admin')) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403));
        }

        return $user;
    }

    private function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug) ?: 'product';
        $candidate = $base;
        $suffix = 1;

        while (
            Product::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function uniquePageSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug) ?: 'page';
        $candidate = $base;
        $suffix = 1;

        while (
            Page::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function uniqueBlogSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug) ?: 'post';
        $candidate = $base;
        $suffix = 1;

        while (
            Blog::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $base . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function razorpayConfigured(): bool
    {
        return (string) env('RAZOR_KEY', '') !== '' && (string) env('RAZOR_SECRET', '') !== '';
    }

    private function productImageUrl(Product $product): ?string
    {
        if ($product->thumbnail_img) {
            return uploaded_asset($product->thumbnail_img);
        }

        $photoIds = array_filter(explode(',', (string) $product->photos));
        if (!empty($photoIds)) {
            return uploaded_asset(reset($photoIds));
        }

        return static_asset('assets/img/placeholder.jpg');
    }
}
