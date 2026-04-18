<?php

namespace App\Http\Resources\V2\Storefront;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\Review;
use App\Models\Attribute;

/**
 * Storefront-safe product detail DTO.
 *
 * Full product data for the PDP. Normalizes photos, choice_options, brand,
 * and pricing into a clean contract. Strips internal-only fields.
 */
class ProductDetailResource extends JsonResource
{
    public function toArray($request)
    {
        $data = $this->resource;
        $calculablePrice = (float) number_format(home_discounted_base_price($data, false), 2, '.', '');
        $hasDiscount = home_base_price($data, false) != home_discounted_base_price($data, false);

        return [
            'id'               => (int) $data->id,
            'slug'             => $data->slug,
            'name'             => $data->getTranslation('name'),
            'description'      => $data->getTranslation('description'),
            'thumbnail_image'  => uploaded_asset($data->thumbnail_img),
            'photos'           => $this->buildPhotos($data),
            'videos'           => $this->buildVideos($data),
            'tags'             => $data->tags ? explode(',', $data->tags) : [],

            // Pricing
            'has_discount'     => $hasDiscount,
            'discount_percent' => $hasDiscount ? (int) discount_in_percentage($data) : 0,
            'stroked_price'    => home_base_price($data),
            'main_price'       => home_discounted_base_price($data),
            'price_range'      => $this->buildPriceRange($data),
            'calculable_price' => $calculablePrice,
            'currency_symbol'  => currency_symbol(),

            // Stock & variants
            'current_stock'    => (int) ($data->stocks->first()->qty ?? 0),
            'unit'             => $data->unit ?? '',
            'choice_options'   => $this->buildChoiceOptions($data),
            'colors'           => json_decode($data->colors) ?? [],
            'is_digital'       => (bool) $data->digital,
            'is_wholesale'     => (bool) $data->wholesale_product,

            // Ratings
            'rating'           => (float) $data->rating,
            'review_count'     => (int) Review::where('product_id', $data->id)->count(),
            'earn_point'       => (float) $data->earn_point,

            // Seller / shop
            'shop'             => $this->buildShop($data),
            'brand'            => $this->buildBrand($data),

            // Shipping
            'est_shipping_days' => (int) $data->est_shipping_days,

            // Digital downloads
            'downloads'        => $data->pdf ? uploaded_asset($data->pdf) : null,
            'video_link'       => $data->video_link ?? null,
        ];
    }

    protected function buildPhotos($data): array
    {
        $photos = [];
        $photoPaths = get_images_path($data->photos);

        foreach ($photoPaths as $path) {
            if ($path != '') {
                $photos[] = ['variant' => '', 'path' => $path];
            }
        }

        foreach ($data->stocks as $stock) {
            if ($stock->image) {
                $photos[] = ['variant' => $stock->variant, 'path' => uploaded_asset($stock->image)];
            }
        }

        return $photos;
    }

    protected function buildVideos($data): array
    {
        $videos = [];
        $videoPaths = $data->short_video ? get_videos_path($data->short_video) : [];
        $thumbnailPaths = $data->short_video_thumbnail ? get_images_path($data->short_video_thumbnail) : [];

        foreach ($videoPaths as $i => $path) {
            if ($path != '') {
                $videos[] = [
                    'path'      => $path,
                    'thumbnail' => $thumbnailPaths[$i] ?? '',
                ];
            }
        }

        return $videos;
    }

    protected function buildPriceRange($data): array
    {
        $low = (float) explode('-', home_discounted_price($data, false))[0];
        $high = (float) (explode('-', home_discounted_price($data, false))[1] ?? $low);

        return [
            'low'       => $low,
            'high'      => $high,
            'formatted' => $low == $high
                ? format_price($low)
                : 'From ' . format_price($low) . ' to ' . format_price($high),
        ];
    }

    protected function buildChoiceOptions($data): array
    {
        $result = [];
        $choiceOptions = json_decode($data->choice_options);

        if ($choiceOptions) {
            foreach ($choiceOptions as $choice) {
                $attribute = Attribute::find($choice->attribute_id);
                $result[] = [
                    'attribute_id' => $choice->attribute_id,
                    'title'        => $attribute ? $attribute->getTranslation('name') : '',
                    'options'      => $choice->values,
                ];
            }
        }

        return $result;
    }

    protected function buildShop($data): array
    {
        if ($data->added_by == 'admin') {
            return [
                'id'   => 0,
                'slug' => '',
                'name' => translate('In House Product'),
                'logo' => uploaded_asset(get_setting('header_logo')),
            ];
        }

        return [
            'id'   => $data->user->shop->id ?? 0,
            'slug' => $data->user->shop->slug ?? '',
            'name' => $data->user->shop->name ?? '',
            'logo' => uploaded_asset($data->user->shop->logo ?? ''),
        ];
    }

    protected function buildBrand($data): array
    {
        if (!$data->brand) {
            return ['id' => 0, 'slug' => '', 'name' => '', 'logo' => ''];
        }

        return [
            'id'   => $data->brand->id,
            'slug' => $data->brand->slug,
            'name' => $data->brand->getTranslation('name'),
            'logo' => uploaded_asset($data->brand->logo),
        ];
    }
}
