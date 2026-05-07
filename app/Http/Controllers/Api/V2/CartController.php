<?php

namespace App\Http\Controllers\Api\V2;

use App\Models\Cart;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Utility\CartUtility;
use App\Utility\NagadUtility;
use Illuminate\Http\Request;

use App\Traits\ApiResponseTrait;
use App\Models\GuestCheckoutSession;

class CartController extends Controller
{
    use ApiResponseTrait;

    protected function resolveCartOwner(Request $request)
    {
        if (auth('sanctum')->check()) {
            return ['user_id' => auth('sanctum')->id(), 'temp_user_id' => null];
        }

        if ($request->hasHeader('X-Guest-Token') || $request->has('guest_token')) {
            $token = $request->header('X-Guest-Token') ?: $request->guest_token;
            $session = GuestCheckoutSession::where('guest_checkout_token_hash', hash('sha256', $token))
                ->where('expires_at', '>', now())
                ->first();

            if ($session) {
                return ['user_id' => $session->guest_user_id, 'temp_user_id' => $session->temp_user_id];
            }
        }

        if ($request->has('temp_user_id')) {
            // Fallback for initial cart creation before checkout starts
            // WARNING: This is less secure but necessary for the current "pre-checkout" guest flow
            return ['user_id' => null, 'temp_user_id' => $request->temp_user_id];
        }

        return ['user_id' => null, 'temp_user_id' => null];
    }

    public function summary(Request $request)
    {
        $owner = $this->resolveCartOwner($request);

        if (!$owner['user_id'] && !$owner['temp_user_id']) {
            return $this->successResponse([
                'sub_total' => format_price(0.00),
                'tax' => format_price(0.00),
                'shipping_cost' => format_price(0.00),
                'discount' => format_price(0.00),
                'grand_total' => format_price(0.00),
                'grand_total_value' => 0.00,
                'coupon_code' => "",
                'coupon_applied' => false,
            ]);
        }

        $items = $owner['user_id'] ? 
                Cart::where('user_id', $owner['user_id'])->active()->get() :
                Cart::where('temp_user_id', $owner['temp_user_id'])->active()->get();

        if ($items->isEmpty()) {
            return $this->successResponse([
                'sub_total' => format_price(0.00),
                'tax' => format_price(0.00),
                'shipping_cost' => format_price(0.00),
                'discount' => format_price(0.00),
                'grand_total' => format_price(0.00),
                'grand_total_value' => 0.00,
                'coupon_code' => "",
                'coupon_applied' => false,
            ]);
        }

        $subtotal = 0.00;
        foreach ($items as $cartItem) {
            $product = Product::find($cartItem['product_id']);
            if ($product) {
                $subtotal += cart_product_price($cartItem, $product, false, false) * $cartItem['quantity'];
            }
        }

        $discount = $items->sum('discount');
        $sum = $subtotal - $discount;

        return $this->successResponse([
            'sub_total' => single_price($subtotal),
            'tax' => single_price(0),
            'shipping_cost' => single_price(0),
            'discount' => single_price($discount),
            'grand_total' => single_price($sum),
            'grand_total_value' => convert_price($sum),
            'coupon_code' => $items[0]->coupon_code,
            'coupon_applied' => $items[0]->coupon_applied == 1,
        ]);
    }

    public function count(Request $request)
    {
        $owner = $this->resolveCartOwner($request);

        $count = 0;
        if ($owner['user_id']) {
            $count = Cart::where('user_id', $owner['user_id'])->active()->count();
        } elseif ($owner['temp_user_id']) {
            $count = Cart::where('temp_user_id', $owner['temp_user_id'])->active()->count();
        }

        return $this->successResponse(['count' => $count]);
    }

    public function getList(Request $request)
    {
        $owner = $this->resolveCartOwner($request);

        $query = Cart::query()->active();
        if ($owner['user_id']) {
            $query->where('user_id', $owner['user_id']);
        } elseif ($owner['temp_user_id']) {
            $query->where('temp_user_id', $owner['temp_user_id']);
        } else {
            return $this->successResponse(["grand_total" => single_price(0), "data" => []]);
        }

        $owner_ids = $query->clone()->select('owner_id')->groupBy('owner_id')->pluck('owner_id')->toArray();

        $currency_symbol = currency_symbol();
        $shops = [];
        $sub_total = 0.00;
        $grand_total = 0.00;

        foreach ($owner_ids as $owner_id) {
            $shop = array();
            $shop_items_raw_data = $query->clone()->where('owner_id', $owner_id)->get();
            $shop_items_data = array();

            foreach ($shop_items_raw_data as $cartItem) {
                $product = Product::find($cartItem->product_id);
                if (!$product) continue;

                $price = cart_product_price($cartItem, $product, false, false) * intval($cartItem->quantity);

                $shop_items_data[] = [
                    "id" => (int)$cartItem->id,
                    "status" => (int)$cartItem->status,
                    "owner_id" => (int)$cartItem->owner_id,
                    "user_id" => (int)$cartItem->user_id,
                    "product_id" => (int)$cartItem->product_id,
                    "product_name" => $product->getTranslation('name'),
                    "product_slug" => $product->slug,
                    "auction_product" => $product->auction_product,
                    "product_thumbnail_image" => uploaded_asset($product->thumbnail_img),
                    "variation" => $cartItem->variation,
                    "price" => single_price($price),
                    "currency_symbol" => $currency_symbol,
                    "tax" => single_price(0),
                    "shipping_cost" => 0,
                    "quantity" => (int)$cartItem->quantity,
                    "lower_limit" => (int)$product->min_qty,
                    "upper_limit" => (int)($product->stocks->where('variant', $cartItem->variation)->first()->qty ?? 0),
                    "digital" => $product->digital,   
                    "stock" => (int)($product->stocks->where('variant', $cartItem->variation)->first()->qty ?? 0), 
                ];
                $sub_total += $price;
            }

            $grand_total += $sub_total;
            $shop_data = Shop::where('user_id', $owner_id)->first();

            $shop['name'] = $shop_data ? translate($shop_data->name) : translate("Inhouse");
            $shop['owner_id'] = (int) $owner_id;
            $shop['sub_total'] = single_price($sub_total);
            $shop['cart_items'] = $shop_items_data;

            $shops[] = $shop;
            $sub_total = 0.00;
        }

        return $this->successResponse([
            "grand_total" => single_price($grand_total),
            "data" => $shops
        ]);
    }

    public function add(Request $request)
    {
        $owner = $this->resolveCartOwner($request);
        $temp_user_id = $owner['temp_user_id'];

        if (!$owner['user_id'] && !$temp_user_id) {
            $temp_user_id = bin2hex(random_bytes(10));
        }

        $query = Cart::query()->active();
        if ($owner['user_id']) {
            $query->where('user_id', $owner['user_id']);
        } else {
            $query->where('temp_user_id', $temp_user_id);
        }
        $carts = $query->get();

        $check_auction_in_cart = CartUtility::check_auction_in_cart($carts);
        $product = Product::findOrFail($request->id);

        if ($check_auction_in_cart && $product->auction_product == 0) {
            return $this->failedResponse(['temp_user_id' => $temp_user_id], translate('Remove auction product from cart to add this product.'));
        }
        if ($check_auction_in_cart == false && count($carts) > 0 && $product->auction_product == 1) {
            return $this->failedResponse(['temp_user_id' => $temp_user_id], translate('Remove other products from cart to add this auction product.'));
        }

        if ($product->min_qty > $request->quantity) {
            return $this->failedResponse(['temp_user_id' => $temp_user_id], translate("Minimum") . " {$product->min_qty} " . translate("item(s) should be ordered"));
        }

        $variant = (string) ($request->variant ?? '');
        $quantity = $request->quantity;

        $product_stock = $product->stocks->where('variant', $variant)->first();
        if (!$product_stock && $product->stocks->count() === 1) {
            $product_stock = $product->stocks->first();
            $variant = (string) ($product_stock->variant ?? '');
        }

        if (!$product_stock) {
            return $this->failedResponse(['temp_user_id' => $temp_user_id], translate('Please choose a valid variant.'));
        }

        $cartData = [
            'variation' => $variant,
            'product_id' => $request['id']
        ];
        if ($owner['user_id']) {
            $cartData['user_id'] = $owner['user_id'];
        } else {
            $cartData['temp_user_id'] = $temp_user_id;
        }

        $cart = Cart::firstOrNew($cartData);
        $variant_string = $variant != null && $variant != "" ? translate("for") . " ($variant)" : "";

        if ($cart->exists && $product->digital == 0) {
            if ($product->auction_product == 1 && ($cart->product_id == $product->id)) {
                return $this->failedResponse(null, translate('This auction product is already added to your cart.'));
            }
            if ($product_stock->qty < $cart->quantity + $request['quantity']) {
                $msg = $product_stock->qty == 0 ? translate("Stock out") : translate("Only") . " {$product_stock->qty} " . translate("item(s) are available") . " {$variant_string}";
                return $this->failedResponse(['temp_user_id' => $temp_user_id], $msg);
            }
            $quantity = $cart->quantity + $request['quantity'];
        }

        $price = CartUtility::get_price($product, $product_stock, $request->quantity);
        $tax = CartUtility::tax_calculation($product, $price);
        CartUtility::save_cart_data($cart, $product, $price, $tax, $quantity);

        if (NagadUtility::create_balance_reference($request->cost_matrix) == false) {
            return $this->failedResponse(null, 'Cost matrix error', 400);
        }

        return $this->successResponse([
            'temp_user_id' => $temp_user_id,
        ], translate('Product added to cart successfully'));
    }

    public function changeQuantity(Request $request)
    {
        $owner = $this->resolveCartOwner($request);
        $cart = Cart::find($request->id);

        if (!$cart) {
            return $this->failedResponse(null, translate('Cart item not found'), 404);
        }

        // Verify ownership
        if ($owner['user_id'] && $cart->user_id != $owner['user_id']) {
            return $this->failedResponse(null, translate('Unauthorized'), 403);
        }
        if (!$owner['user_id'] && $cart->temp_user_id != $owner['temp_user_id']) {
            return $this->failedResponse(null, translate('Unauthorized'), 403);
        }

        $product = Product::find($cart->product_id);
        if ($product->auction_product == 1) {
            return $this->failedResponse(null, translate('Maximum available quantity reached'));
        }

        $stock = $product->stocks->where('variant', $cart->variation)->first()->qty ?? 0;
        if ($stock >= $request->quantity || $product->digital == 1) {
            $cart->update(['quantity' => $request->quantity]);
            return $this->successResponse(['id' => $cart->id, 'quantity' => $cart->quantity], translate('Cart updated'));
        }

        return $this->failedResponse(null, translate('Maximum available quantity reached'));
    }

    public function process(Request $request)
    {
        $owner = $this->resolveCartOwner($request);
        $cart_ids = explode(",", $request->cart_ids);
        $cart_quantities = explode(",", $request->cart_quantities);

        if (empty($cart_ids)) {
             return $this->failedResponse(null, translate('Cart is empty'));
        }

        foreach ($cart_ids as $index => $cart_id) {
            $cart_item = Cart::find($cart_id);
            if (!$cart_item) continue;

            // Ownership check
            if (($owner['user_id'] && $cart_item->user_id != $owner['user_id']) ||
                (!$owner['user_id'] && $cart_item->temp_user_id != $owner['temp_user_id'])) {
                continue;
            }

            $product = Product::find($cart_item->product_id);
            if ($product->min_qty > $cart_quantities[$index]) {
                return $this->failedResponse(null, translate("Minimum") . " {$product->min_qty} " . translate("item(s) should be ordered for") . " {$product->name}");
            }

            $stock = $product->stocks->where('variant', $cart_item->variation)->first()->qty ?? 0;
            if ($stock >= $cart_quantities[$index] || $product->digital == 1) {
                $cart_item->update(['quantity' => $cart_quantities[$index]]);
            } else {
                $variant_string = $cart_item->variation ? " ($cart_item->variation)" : "";
                $msg = $stock == 0 ? translate("No item is available for") . " {$product->name}{$variant_string}" : translate("Only") . " {$stock} " . translate("item(s) are available for") . " {$product->name}{$variant_string}";
                return $this->failedResponse(null, $msg);
            }
        }

        return $this->successResponse(null, translate('Cart updated'));
    }

    public function destroy($id)
    {
        $owner = $this->resolveCartOwner(request());
        $cart = Cart::find($id);

        if ($cart) {
            if (($owner['user_id'] && $cart->user_id == $owner['user_id']) ||
                (!$owner['user_id'] && $cart->temp_user_id == $owner['temp_user_id'])) {
                $deletedId = $cart->id;
                $cart->delete();
                return $this->successResponse(['id' => $deletedId], translate('Product is successfully removed from your cart'));
            }
        }

        return $this->failedResponse(null, translate('Unauthorized or item not found'), 403);
    }

    public function guestCustomerInfoCheck(Request $request){
        $user = addon_is_activated('otp_system') ?
                User::where('email', $request->email)->orWhere('phone','+'.$request->phone)->first() :
                User::where('email', $request->email)->first();

        return $this->successResponse(['exists' => $user !== null]);
    }

    public function updateCartStatus(Request $request)
    {
        $owner = $this->resolveCartOwner($request);
        $product_ids = $request->product_ids;

        $query = Cart::query();
        if ($owner['user_id']) {
            $query->where('user_id', $owner['user_id']);
        } elseif ($owner['temp_user_id']) {
            $query->where('temp_user_id', $owner['temp_user_id']);
        } else {
            return $this->failedResponse(null, translate('Unauthorized'), 403);
        }

        $query->update(['status' => 0]);
        if($product_ids != null){
            $query->whereIn('product_id', $product_ids)->update(['status' => 1]);
        }

        return $this->successResponse(null, translate('Cart status updated successfully'));
    }
}
