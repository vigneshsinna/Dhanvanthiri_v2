<?php

namespace App\Http\Resources\V2\Storefront;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Storefront-safe product summary DTO.
 *
 * Used in listings, search results, grids, and anywhere a compact product representation is needed.
 * Strips internal fields (user_id, seller_id) and normalizes price/image formats.
 */
class ProductSummaryResource extends JsonResource
{
    public function toArray($request)
    {
        $hasDiscount = home_base_price($this->resource, false) != home_discounted_base_price($this->resource, false);

        return [
            'id'              => (int) $this->id,
            'slug'            => $this->slug,
            'name'            => $this->getTranslation('name'),
            'thumbnail_image' => uploaded_asset($this->thumbnail_img),
            'has_discount'    => $hasDiscount,
            'discount_percent' => $hasDiscount ? (int) discount_in_percentage($this->resource) : 0,
            'stroked_price'   => home_base_price($this->resource),
            'main_price'      => home_discounted_base_price($this->resource),
            'calculable_price' => (float) number_format(home_discounted_base_price($this->resource, false), 2, '.', ''),
            'currency_symbol' => currency_symbol(),
            'rating'          => (float) $this->rating,
            'review_count'    => (int) $this->reviews->count(),
            'sales'           => (int) $this->num_of_sale,
            'in_stock'        => (bool) ($this->stocks->sum('qty') > 0),
            'is_digital'      => (bool) $this->digital,
            'is_wholesale'    => (bool) $this->wholesale_product,
        ];
    }
}
