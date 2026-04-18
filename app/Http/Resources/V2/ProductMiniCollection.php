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
                    'badge' => $data->badge ?? '',
                    'tamil_name' => $data->tamil_name ?? '',
                    'custom_labels' => $data->custom_labels ?? '',
                    'is_premium' => $data->is_premium ?? false,
                    'storage' => $data->storage ?? '',
                    'taste_profile' => $data->taste_profile ?? '',
                    'pair_with' => $data->pair_with ?? '',
                    'about' => $data->about ?? '',
                    'why_love' => $data->why_love ?? '',
                    'reviews' => $data->reviews ?? '',
                    'avg_rating' => $data->avg_rating ?? '',
                    'average_rating' => $data->average_rating ?? '',
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
