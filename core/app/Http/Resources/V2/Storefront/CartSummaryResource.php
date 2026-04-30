<?php

namespace App\Http\Resources\V2\Storefront;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\Cart;
use App\Models\Product;

/**
 * Storefront-safe cart summary DTO.
 *
 * Returns the full cart state: grouped items by seller, totals, coupon info.
 * This replaces the inconsistent CartController::summary() + getList() endpoints
 * with a single normalized representation.
 */
class CartSummaryResource extends JsonResource
{
    /**
     * @param mixed $request
     * @return array
     */
    public function toArray($request)
    {
        $userId = $this->resource['user_id'] ?? null;
        $tempUserId = $this->resource['temp_user_id'] ?? null;

        $cartQuery = $userId
            ? Cart::where('user_id', $userId)->active()
            : Cart::where('temp_user_id', $tempUserId)->active();

        $cartItems = $cartQuery->get();

        $subtotal = 0;
        $tax = 0;
        $shippingCost = 0;
        $discount = 0;
        $couponCode = null;
        $couponApplied = false;
        $sellerGroups = [];

        foreach ($cartItems as $item) {
            $product = Product::find($item->product_id);
            if (!$product) continue;

            $itemPrice = cart_product_price($item, $product, false, false);
            $itemTax = cart_product_tax($item, $product, false);

            $subtotal += $itemPrice * $item->quantity;
            $tax += $itemTax * $item->quantity;
            $shippingCost += (float) $item->shipping_cost;
            $discount += (float) $item->discount;

            if ($item->coupon_code) {
                $couponCode = $item->coupon_code;
                $couponApplied = (bool) $item->coupon_applied;
            }

            $sellerId = (int) $item->seller_id;
            if (!isset($sellerGroups[$sellerId])) {
                $sellerGroups[$sellerId] = [
                    'seller_id' => $sellerId,
                    'items'     => [],
                ];
            }

            $sellerGroups[$sellerId]['items'][] = (new CartItemResource($item))->toArray($request);
        }

        $grandTotal = $subtotal + $tax + $shippingCost - $discount;

        return [
            'item_count'     => $cartItems->count(),
            'sellers'        => array_values($sellerGroups),
            'totals'         => [
                'subtotal'      => round($subtotal, 2),
                'tax'           => round($tax, 2),
                'shipping_cost' => round($shippingCost, 2),
                'discount'      => round($discount, 2),
                'grand_total'   => round(max($grandTotal, 0), 2),
            ],
            'coupon'         => [
                'code'    => $couponCode,
                'applied' => $couponApplied,
            ],
        ];
    }
}
