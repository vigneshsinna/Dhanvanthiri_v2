<?php

namespace App\Http\Resources\V2\Storefront;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Storefront-safe order detail DTO.
 *
 * Full order data for the order detail page, including shipping address,
 * line items, and financial breakdown.
 */
class OrderDetailResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                    => (int) $this->id,
            'code'                  => $this->code,
            'payment_type'          => $this->payment_type,
            'payment_type_label'    => ucwords(str_replace('_', ' ', $this->payment_type)),
            'payment_status'        => $this->payment_status,
            'delivery_status'       => $this->delivery_status,
            'delivery_status_label' => $this->delivery_status == 'pending'
                ? translate('Order Placed')
                : ucwords(str_replace('_', ' ', translate($this->delivery_status))),
            'shipping_address'      => json_decode($this->shipping_address),
            'shipping_type'         => $this->shipping_type,
            'shipping_type_label'   => $this->shipping_type
                ? ucwords(str_replace('_', ' ', translate($this->shipping_type)))
                : '',
            'totals'                => [
                'subtotal'        => (float) $this->orderDetails->sum('price'),
                'tax'             => (float) $this->orderDetails->sum('tax'),
                'shipping_cost'   => (float) $this->orderDetails->sum('shipping_cost'),
                'coupon_discount' => (float) $this->coupon_discount,
                'grand_total'     => (float) $this->grand_total,
            ],
            'items'                 => $this->orderDetails->map(function ($detail) {
                return [
                    'id'            => (int) $detail->id,
                    'product_id'    => (int) $detail->product_id,
                    'product_name'  => $detail->product ? $detail->product->getTranslation('name') : 'Deleted Product',
                    'product_image' => $detail->product ? uploaded_asset($detail->product->thumbnail_img) : '',
                    'variation'     => $detail->variation,
                    'quantity'      => (int) $detail->quantity,
                    'price'         => (float) $detail->price,
                    'tax'           => (float) $detail->tax,
                    'shipping_cost' => (float) $detail->shipping_cost,
                    'delivery_status' => $detail->delivery_status,
                ];
            }),
            'date'                  => Carbon::createFromTimestamp($this->date)->toIso8601String(),
            'is_cancellable'        => $this->delivery_status == 'pending' && $this->payment_status == 'unpaid',
            'cancel_requested'      => (bool) $this->cancel_request,
            'manually_payable'      => (bool) ($this->manual_payment && $this->manual_payment_data == null),
        ];
    }
}
