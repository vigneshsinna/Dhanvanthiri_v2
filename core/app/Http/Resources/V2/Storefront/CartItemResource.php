<?php

namespace App\Http\Resources\V2\Storefront;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Storefront-safe cart item DTO.
 *
 * Normalizes cart representation with typed prices and stock awareness.
 */
class CartItemResource extends JsonResource
{
    public function toArray($request)
    {
        $product = $this->product;

        return [
            'id'            => (int) $this->id,
            'product_id'    => (int) $this->product_id,
            'seller_id'     => (int) $this->seller_id,
            'product'       => [
                'name'            => $product->getTranslation('name'),
                'slug'            => $product->slug,
                'thumbnail_image' => uploaded_asset($product->thumbnail_img),
                'digital'         => (bool) $product->digital,
            ],
            'variation'     => $this->variation ?? '',
            'quantity'      => (int) $this->quantity,
            'price'         => (float) cart_product_price($this->resource, $product, false, false),
            'tax'           => (float) cart_product_tax($this->resource, $product, false),
            'shipping_cost' => (float) $this->shipping_cost,
            'discount'      => (float) $this->discount,
            'coupon_code'   => $this->coupon_code,
            'line_total'    => (float) (cart_product_price($this->resource, $product, false, false) + cart_product_tax($this->resource, $product, false)) * $this->quantity,
        ];
    }
}
