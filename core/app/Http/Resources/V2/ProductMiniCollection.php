<?php

namespace App\Http\Resources\V2;

use Illuminate\Http\Resources\Json\ResourceCollection;

class ProductMiniCollection extends ResourceCollection
{
    public function toArray($request)
    {
        return [
            'data' => $this->collection->map(function ($data) {
                $wholesale_product =
                    ($data->wholesale_product == 1) ? true : false;
                return [
                    'id' => $data->id,
                    'slug' => $data->slug,
                    'name' => $data->getTranslation('name'),
                    'thumbnail_image' => uploaded_asset($data->thumbnail_img),
                    'has_discount' => home_base_price($data, false) != home_discounted_base_price($data, false),
                    'discount' => "-" . discount_in_percentage($data) . "%",
                    'stroked_price' => home_base_price($data),
                    'main_price' => home_discounted_base_price($data),
                    'rating' => (float) $data->rating,
                    'review_count' => $data->reviews->count(),
                    'sales' => (int) $data->num_of_sale,
                    'is_wholesale' => $wholesale_product,
                    'short_description' => $data->getTranslation('short_description') ?? '',
                    'description' => $data->getTranslation('description') ?? '',
                    'badge' => $data->badge ?? '',
                    'tamil_name' => $data->tamil_name ?? '',
                    'custom_labels' => json_decode($data->chips) ?? json_decode($data->custom_labels) ?? [],
                    'chips' => json_decode($data->chips) ?? [],
                    'is_premium' => $data->is_premium ?? false,
                    'storage' => $data->storage ?? '',
                    'taste_profile' => $data->taste_profile ?? '',
                    'pair_with' => json_decode($data->pair_with) ?? [],
                    'about' => $data->about ?? '',
                    'why_love' => json_decode($data->why_love) ?? [],
                    'reviews' => $data->reviews ?? '',
                    'avg_rating' => $data->avg_rating ?? '',
                    'average_rating' => $data->average_rating ?? '',
                    'unit' => $data->unit ?? '',
                    'variants' => $data->stocks->map(function ($stock) use ($data) {
                        return [
                            'id' => (int) $stock->id,
                            'name' => $stock->variant ?: ($data->unit ?? 'Default'),
                            'sku' => $stock->sku ?? '',
                            'price_override' => $stock->price != $data->unit_price ? (float) $stock->price : null,
                            'stock_quantity' => (int) $stock->qty,
                        ];
                    })->values(),
                    'links' => [
                        'details' => route('products.show', $data->id),
                        'storefront' => storefront_url('products/' . $data->slug),
                    ]
                ];
            })
        ];
    }

    public function with($request)
    {
        return [
            'success' => true,
            'status' => 200
        ];
    }
}
