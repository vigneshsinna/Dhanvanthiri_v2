<?php

namespace App\Http\Resources\V2\Storefront;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Storefront-safe checkout session DTO.
 *
 * Represents a checkout-in-progress: validated cart, selected address,
 * shipping options, and eligible payment methods. The storefront uses this
 * to render the checkout flow steps.
 *
 * Lifecycle:
 *   cart → validate → address → shipping → payment → confirm
 */
class CheckoutSessionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'phase'              => $this->resource['phase'] ?? 'cart',  // cart|address|shipping|payment|review
            'cart_summary'       => $this->resource['cart_summary'] ?? null,
            'shipping_address'   => $this->resource['shipping_address'] ?? null,
            'available_shipping' => $this->resource['available_shipping'] ?? [],
            'selected_shipping'  => $this->resource['selected_shipping'] ?? null,
            'available_payments' => $this->resource['available_payments'] ?? [],
            'selected_payment'   => $this->resource['selected_payment'] ?? null,
            'totals'             => $this->resource['totals'] ?? [
                'subtotal'       => 0,
                'tax'            => 0,
                'shipping_cost'  => 0,
                'discount'       => 0,
                'grand_total'    => 0,
            ],
            'coupon'             => $this->resource['coupon'] ?? [
                'code'    => null,
                'applied' => false,
            ],
        ];
    }
}
