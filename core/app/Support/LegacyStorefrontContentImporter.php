<?php

namespace App\Support;

use App\Models\Blog;
use App\Models\BusinessSetting;
use App\Models\Page;
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

        foreach (config('legacy_storefront_content.blog_banners', []) as $slug => $imagePath) {
            $this->importBlogBanner($slug, $imagePath, $admin);
        }

        $this->importContactPage();
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
        $blog->meta_img = $uploadId;
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

        $source = $this->resolveLegacyImageSource($relativePath);
        if (!$source) {
            return null;
        }

        $extension = strtolower(pathinfo($source, PATHINFO_EXTENSION));
        $fileName = pathinfo($source, PATHINFO_FILENAME);
        $targetRelativePath = 'uploads/all/legacy-storefront/' . md5($relativePath) . '-' . Str::slug($fileName) . '.' . $extension;
        $targetAbsolutePath = public_path($targetRelativePath);

        if (!File::exists(dirname($targetAbsolutePath))) {
            File::makeDirectory(dirname($targetAbsolutePath), 0755, true);
        }

        $sourcePath = realpath($source);
        $targetPath = File::exists($targetAbsolutePath) ? realpath($targetAbsolutePath) : false;

        if (!$targetPath || $sourcePath !== $targetPath) {
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

    private function resolveLegacyImageSource(string $relativePath): ?string
    {
        $relativePath = ltrim(str_replace('\\', '/', $relativePath), '/');
        $extension = strtolower(pathinfo($relativePath, PATHINFO_EXTENSION));
        $slug = Str::slug(pathinfo($relativePath, PATHINFO_FILENAME));
        $legacyDir = public_path('uploads/all/legacy-storefront');

        $candidates = [
            base_path('frontend/public/' . $relativePath),
            public_path($relativePath),
            public_path('uploads/all/' . basename($relativePath)),
            public_path('uploads/all/blog/' . basename($relativePath)),
            public_path('uploads/all/about/' . basename($relativePath)),
            public_path('uploads/all/legacy-storefront/' . basename($relativePath)),
        ];

        if ($extension) {
            $candidates[] = $legacyDir . '/' . md5('/' . $relativePath) . '-' . $slug . '.' . $extension;
            $candidates[] = $legacyDir . '/' . md5($relativePath) . '-' . $slug . '.' . $extension;
        }

        $candidates[] = $legacyDir . '/' . basename($relativePath);

        foreach ($candidates as $candidate) {
            if (File::exists($candidate) && File::isFile($candidate)) {
                return $candidate;
            }
        }

        if (File::isDirectory($legacyDir)) {
            foreach (File::files($legacyDir) as $file) {
                $legacyName = strtolower($file->getFilename());
                if ($slug && str_contains(Str::slug(pathinfo($legacyName, PATHINFO_FILENAME)), $slug)) {
                    return $file->getPathname();
                }
            }
        }

        return null;
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
