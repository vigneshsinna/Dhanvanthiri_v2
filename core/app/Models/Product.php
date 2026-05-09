<?php

namespace App\Models;

use App;
use Illuminate\Database\Eloquent\Model;
use App\Traits\PreventDemoModeChanges;
use Illuminate\Database\Eloquent\Casts\Attribute;


class Product extends Model
{
    use PreventDemoModeChanges;
    
    protected $guarded = ['choice_attributes'];

    protected $with = ['product_translations', 'taxes', 'thumbnail'];

    public function getTranslation($field = '', $lang = false)
    {
        $lang = $lang == false ? App::getLocale() : $lang;
        $product_translations = $this->product_translations->where('lang', $lang)->first();
        return $product_translations != null ? $product_translations->$field : $this->$field;
    }

    public function product_translations()
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function main_category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
    
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    public function frequently_bought_products()
    {
        return $this->hasMany(FrequentlyBoughtProduct::class);
    }

    public function product_categories()
    {
        return $this->hasMany(ProductCategory::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function product_queries()
    {
        return $this->hasMany(ProductQuery::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    public function taxes()
    {
        return $this->hasMany(ProductTax::class);
    }

    public function flash_deal_products()
    {
        return $this->hasMany(FlashDealProduct::class);
    }

    public function bids()
    {
        return $this->hasMany(AuctionProductBid::class);
    }

    public function thumbnail()
    {
        return $this->belongsTo(Upload::class, 'thumbnail_img');
    }

    public function scopePhysical($query)
    {
        return $query->where('digital', 0);
    }

    public function scopeDigital($query)
    {
        return $query->where('digital', 1);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }
    
    public function scopeIsApprovedPublished($query)
    {
        return $query->where('approved', '1')->where('published', 1);
    }

    public function last_viewed_products()
    {
        return $this->hasMany(LastViewedProduct::class);
    }

    public function warranty()
    {
        return $this->belongsTo(Warranty::class);
    }

    public function warrantyNote()
    {
        return $this->belongsTo(Note::class, 'warranty_note_id');
    }

    public function refundNote()
    {
        return $this->belongsTo(Note::class, 'refund_note_id');
    }

    public function customSaleAlerts()
    {
        return $this->hasMany(CustomSaleAlert::class, 'product_id');
    }

    // add gallery image to thumb

    public function thumbnailImg(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                return self::resolveThumbnailReferenceFromAttributes($attributes);
            },
            set: fn ($value) => self::sanitizeSingleMediaReference($value),
        );
    }

    public function resolvedThumbnailReference(): Attribute
    {
        return Attribute::get(function ($value, $attributes) {
            return self::resolveThumbnailReferenceFromAttributes($attributes);
        });
    }

    public function photos(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => self::sanitizeMediaReference($value),
            set: fn ($value) => self::sanitizeMediaReference($value),
        );
    }


    protected function videoLink(): Attribute
    {
        return Attribute::make(
           
            get: fn($value) => json_decode($value, true), 

         
             set: function ($value) {
                if (!is_array($value)) {
                    return null;
                }
            
                $filtered = array_filter($value, function ($item) {
                    return trim($item) !== '';
                });

                return empty($filtered) ? null : json_encode($filtered);
            },
        );
    }

    protected static function resolveThumbnailReferenceFromAttributes(array $attributes): ?string
    {
        $thumbnail = $attributes['thumbnail_img'] ?? null;
        if (self::isUsableMediaReference($thumbnail, true)) {
            return (string) $thumbnail;
        }

        $photos = self::mediaReferenceParts($attributes['photos'] ?? null);
        foreach ($photos as $photo) {
            if (self::isUsableMediaReference($photo, true)) {
                return $photo;
            }
        }

        return null;
    }

    public static function sanitizeMediaReference(mixed $reference): ?string
    {
        $validParts = self::mediaReferenceParts($reference);

        return !empty($validParts) ? implode(',', $validParts) : null;
    }

    public static function sanitizeSingleMediaReference(mixed $reference): ?string
    {
        $validParts = self::mediaReferenceParts($reference);

        return $validParts[0] ?? null;
    }

    protected static function mediaReferenceParts(mixed $reference): array
    {
        if (blank($reference) || !is_scalar($reference)) {
            return [];
        }

        $parts = explode(',', (string) $reference);
        $validParts = [];

        foreach ($parts as $part) {
            $part = trim($part);
            if (self::isUsableMediaReference($part)) {
                $validParts[] = $part;
            }
        }

        return $validParts;
    }

    protected static function isUsableMediaReference(mixed $reference, bool $verifyUploadExists = false): bool
    {
        if (blank($reference) || !is_scalar($reference)) {
            return false;
        }

        $reference = (string) $reference;

        // Filter out common JS-generated invalid strings and path fragments
        $invalidStrings = [
            'undefined',
            'null',
            'nan',
            'not defined',
            '[object object]',
            'all',
            'uploads',
            'uploads/all',
            'public/uploads/all',
            'core/public/uploads/all',
        ];

        $trimmed = strtolower(trim($reference));
        $pathFragment = trim(str_replace('\\', '/', $trimmed), '/');
        if (
            in_array($trimmed, $invalidStrings, true)
            || in_array($pathFragment, $invalidStrings, true)
            || $trimmed === '/'
            || str_ends_with($trimmed, '/')
        ) {
            return false;
        }

        // If it's a comma separated list, check if at least one part is valid
        if (str_contains($reference, ',')) {
            $parts = explode(',', $reference);
            foreach ($parts as $part) {
                if (self::isUsableMediaReference(trim($part))) {
                    return true;
                }
            }
            return false;
        }

        // If it's a string but not a digit, it should look like a URL or a filename with extension
        if (!ctype_digit($trimmed)) {
            if (filter_var($reference, FILTER_VALIDATE_URL)) {
                return true;
            }

            $validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'mp4', 'webm', 'ogg'];
            $ext = strtolower(pathinfo($trimmed, PATHINFO_EXTENSION));
            if (in_array($ext, $validExtensions)) {
                return true;
            }

            return false; // String without extension or URL is likely a fragment
        }

        if (ctype_digit($trimmed)) {
            if ((int) $trimmed <= 0) {
                return false;
            }

            return !$verifyUploadExists || Upload::query()->whereKey((int) $trimmed)->exists();
        }

        return false;
    }

}
