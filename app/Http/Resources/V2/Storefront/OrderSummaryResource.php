<?php

namespace App\Http\Resources\V2\Storefront;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Storefront-safe order summary DTO.
 *
 * Compact order representation for order history lists.
 */
class OrderSummaryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                     => (int) $this->id,
            'code'                   => $this->code,
            'payment_type'           => $this->payment_type,
            'payment_type_label'     => ucwords(str_replace('_', ' ', $this->payment_type)),
            'payment_status'         => $this->payment_status,
            'delivery_status'        => $this->delivery_status,
            'delivery_status_label'  => $this->delivery_status == 'pending'
                ? translate('Order Placed')
                : ucwords(str_replace('_', ' ', translate($this->delivery_status))),
            'totals'                 => [
                'subtotal'       => (float) $this->orderDetails->sum('price'),
                'tax'            => (float) $this->orderDetails->sum('tax'),
                'shipping_cost'  => (float) $this->orderDetails->sum('shipping_cost'),
                'coupon_discount' => (float) $this->coupon_discount,
                'grand_total'    => (float) $this->grand_total,
            ],
            'item_count'             => $this->orderDetails->count(),
            'date'                   => Carbon::createFromTimestamp($this->date)->toIso8601String(),
            'is_cancellable'         => $this->delivery_status == 'pending' && $this->payment_status == 'unpaid',
            'cancel_requested'       => (bool) $this->cancel_request,
        ];
    }
}
