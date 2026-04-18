<?php

namespace App\Support;

use App\Models\Blog;
use App\Models\BusinessSetting;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Upload;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LegacyStorefrontContentImporter
{
    public function import(): void
    {
        (new \StorefrontContentSeeder())->run();

        $admin = $this->adminUser();

        foreach (config('legacy_storefront_content.products', []) as $productData) {
            $this->importProduct($productData, $admin);
        }

        foreach (config('legacy_storefront_content.blog_banners', []) as $slug => $imagePath) {
            $this->importBlogBanner($slug, $imagePath, $admin);
        }

        $this->importContactPage();
    }

    private function importProduct(array $productData, User $admin): void
    {
        $uploadId = $this->importLocalImage((string) $productData['image_path'], $admin);
        $price = (float) ($productData['price'] ?? 0);
        $stockQuantity = (int) ($productData['stock_quantity'] ?? 0);

        $product = $this->canonicalProductForSlug((string) $productData['slug']);
        $product->forceFill([
            'name' => $productData['name'],
            'slug' => $productData['slug'],
            'description' => $productData['description'],
            'added_by' => 'admin',
            'user_id' => $admin->id,
            'approved' => 1,
            'published' => 1,
            'draft' => 0,
            'cash_on_delivery' => 1,
            'current_stock' => $stockQuantity,
            'unit_price' => $price,
            'purchase_price' => $price,
            'unit' => $productData['unit'] ?? '',
            'low_stock_quantity' => 5,
            'tags' => implode(',', $productData['tags'] ?? []),
            'thumbnail_img' => $uploadId,
            'photos' => $uploadId ? (string) $uploadId : '',
            'rating' => 0,
            'num_of_sale' => 0,
        ]);
        $product->save();

        $stock = $product->stocks()->first() ?: new ProductStock();
        $stock->forceFill([
            'product_id' => $product->id,
            'variant' => '',
            'sku' => $productData['sku'] ?? Str::upper(Str::slug($productData['slug'], '-')),
            'price' => $price,
            'qty' => $stockQuantity,
            'image' => $uploadId,
        ]);
        $stock->save();
    }

    private function canonicalProductForSlug(string $slug): Product
    {
        $products = Product::where('slug', $slug)->orderByDesc('id')->get();

        if ($products->isEmpty()) {
            return new Product();
        }

        $canonical = $products->first();

        foreach ($products->slice(1) as $duplicate) {
            $this->archiveDuplicateProduct($duplicate);
        }

        return $canonical;
    }

    private function archiveDuplicateProduct(Product $product): void
    {
        $archivedSlug = $product->slug . '-archived-' . $product->id;
        $archivedName = Str::contains((string) $product->name, '[Archived Duplicate]')
            ? $product->name
            : trim((string) $product->name . ' [Archived Duplicate]');

        $product->forceFill([
            'name' => $archivedName,
            'slug' => $archivedSlug,
            'added_by' => 'legacy_archived',
            'published' => 0,
            'draft' => 1,
            'approved' => 0,
        ]);
        $product->save();
    }

    private function importBlogBanner(string $slug, string $imagePath, User $admin): void
    {
        $blog = Blog::where('slug', $slug)->first();
        if (!$blog) {
            return;
        }

        $uploadId = $this->importLocalImage($imagePath, $admin);
        if (!$uploadId) {
            return;
        }

        $blog->banner = $uploadId;
        $blog->save();
    }

    private function importContactPage(): void
    {
        $contact = config('legacy_storefront_content.contact', []);

        $page = Page::firstOrNew(['slug' => 'contact-us']);
        $page->forceFill([
            'title' => 'Contact Us',
            'slug' => 'contact-us',
            'type' => 'contact_us_page',
            'content' => json_encode([
                'description' => (string) ($contact['description'] ?? ''),
                'address' => (string) ($contact['address'] ?? ''),
                'phone' => (string) ($contact['phone'] ?? ''),
                'email' => (string) ($contact['email'] ?? ''),
            ], JSON_UNESCAPED_UNICODE),
            'meta_title' => 'Contact Us | Dhanvanthiri Foods',
            'meta_description' => 'Get in touch with Dhanvanthiri Foods for product questions, order support, and general enquiries.',
        ]);
        $page->save();

        $this->upsertBusinessSetting('contact_email', (string) ($contact['email'] ?? ''));
        $this->upsertBusinessSetting('contact_phone', (string) ($contact['phone'] ?? ''));
        $this->upsertBusinessSetting('contact_address', (string) ($contact['address'] ?? ''));
    }

    private function importLocalImage(string $relativePath, User $admin): ?int
    {
        $relativePath = trim($relativePath);
        if ($relativePath === '') {
            return null;
        }

        $source = base_path('frontend/public/' . ltrim($relativePath, '/'));
        if (!File::exists($source)) {
            return null;
        }

        $extension = strtolower(pathinfo($source, PATHINFO_EXTENSION));
        $fileName = pathinfo($source, PATHINFO_FILENAME);
        $targetRelativePath = 'uploads/all/legacy-storefront/' . md5($relativePath) . '-' . Str::slug($fileName) . '.' . $extension;
        $targetAbsolutePath = public_path($targetRelativePath);

        if (!File::exists(dirname($targetAbsolutePath))) {
            File::makeDirectory(dirname($targetAbsolutePath), 0755, true);
        }

        if (!File::exists($targetAbsolutePath)) {
            File::copy($source, $targetAbsolutePath);
        }

        $upload = Upload::withTrashed()->firstOrNew(['file_name' => $targetRelativePath]);
        $upload->deleted_at = null;
        $upload->file_original_name = $fileName;
        $upload->extension = $extension;
        $upload->user_id = $admin->id;
        $upload->type = 'image';
        $upload->file_size = filesize($targetAbsolutePath) ?: 0;
        $upload->save();

        return $upload->id;
    }

    private function adminUser(): User
    {
        $admin = User::where('user_type', 'admin')->first();

        if ($admin) {
            return $admin;
        }

        $admin = new User();
        $admin->forceFill([
            'name' => 'Legacy Import Admin',
            'email' => 'legacy-import-admin@example.test',
            'password' => bcrypt(Str::random(32)),
            'user_type' => 'admin',
            'email_verified_at' => now(),
        ]);
        $admin->save();

        return $admin;
    }

    private function upsertBusinessSetting(string $type, string $value): void
    {
        $setting = BusinessSetting::firstOrNew(['type' => $type]);
        $setting->value = $value;
        $setting->save();
    }
}
