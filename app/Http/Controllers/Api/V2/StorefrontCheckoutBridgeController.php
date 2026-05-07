<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Carrier;
use App\Models\Cart;
use App\Models\City;
use App\Models\CombinedOrder;
use App\Models\Country;
use App\Models\Product;
use App\Models\State;
use App\Models\User;
use App\Support\Checkout\AllowedPaymentMethods;
use App\Support\Checkout\PaymentGatewayConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Razorpay\Api\Api;
use Throwable;

class StorefrontCheckoutBridgeController extends Controller
{
    public function statesList(): JsonResponse
    {
        $states = State::where('status', 1)->orderBy('name')->get(['id', 'name', 'zone_id']);
        return response()->json(['success' => true, 'data' => $states]);
    }

    public function shippingRates(Request $request): JsonResponse
    {
        $addressId = (int) $request->input('address_id', 0);
        $stateName = (string) $request->input('state', '');
        $user = $request->user();

        $shippingType = get_setting('shipping_type');

        // ── For carrier_wise_shipping: resolve zone from state name or address ──
        if ($shippingType === 'carrier_wise_shipping') {
            $zoneId = null;

            // Authenticated user with a saved address
            if ($user && $addressId > 0) {
                $address = Address::where('id', $addressId)->where('user_id', $user->id)->first();
                if ($address) {
                    if ($address->city_id) {
                        $city = City::find($address->city_id);
                        if ($city && $city->state_id) {
                            $state = State::find($city->state_id);
                            $zoneId = $state?->zone_id ?: null;
                        }
                    }
                    if (!$zoneId && $address->state_id) {
                        $state = State::find($address->state_id);
                        $zoneId = $state?->zone_id ?: null;
                    }
                    // Fallback: match state by name from address text
                    if (!$zoneId && $address->country_id) {
                        $country = Country::find($address->country_id);
                        $zoneId = $country?->zone_id ?: null;
                    }
                }
            }

            // Guest or no city_id: match zone by state name sent from frontend
            if (!$zoneId && $stateName !== '') {
                $state = State::where('name', $stateName)->first();
                $zoneId = $state?->zone_id ?: null;
            }

            if (!$zoneId) {
                return response()->json([
                    'success' => true,
                    'data' => ['items' => []],
                    'message' => 'No carriers available for the selected state.',
                ]);
            }

            // Get active carriers that serve this zone
            $carriers = Carrier::where('status', 1)
                ->where(function ($q) use ($zoneId) {
                    $q->where('free_shipping', 1)
                      ->orWhereIn('id', function ($sub) use ($zoneId) {
                          $sub->select('carrier_ranges.carrier_id')
                              ->from('carrier_range_prices')
                              ->join('carrier_ranges', 'carrier_ranges.id', '=', 'carrier_range_prices.carrier_range_id')
                              ->where('carrier_range_prices.zone_id', $zoneId);
                      });
                })
                ->get();

            $carriers = $carriers->filter(function (Carrier $carrier) use ($zoneId) {
                $carrierName = strtolower((string) $carrier->name);

                if (in_array((int) $zoneId, [1, 2], true)) {
                    return str_contains($carrierName, 'st');
                }

                if ((int) $zoneId === 3) {
                    return str_contains($carrierName, 'dtdc');
                }

                return true;
            })->values();

            $carts = $user
                ? Cart::where('user_id', $user->id)->active()->get()
                : Cart::where('temp_user_id', $request->input('cart_token', ''))->active()->get();

            $shippingInfo = [
                'country_id' => 1,
                'state_id' => null,
                'city_id' => null,
                'area_id' => null,
            ];

            if ($user && $addressId > 0) {
                $address = Address::where('id', $addressId)->where('user_id', $user->id)->first();
                if ($address) {
                    $shippingInfo['city_id'] = $address->city_id;
                    $shippingInfo['state_id'] = $address->state_id;
                    if ($address->city_id) {
                        $city = City::find($address->city_id);
                        $shippingInfo['state_id'] = $city?->state_id ?: $address->state_id;
                    }
                }
            }

            if (!$shippingInfo['state_id'] && $stateName !== '') {
                $shippingInfo['state_id'] = State::where('name', $stateName)->value('id');
            }

            $items = [];
            foreach ($carriers as $carrier) {
                if ($carrier->free_shipping) {
                    $cost = 0;
                } else {
                    $cost = 0;
                    if ($carts->isNotEmpty()) {
                        foreach ($carts as $key => $cart) {
                            $cost += getShippingCost($carts, $key, $shippingInfo, $carrier->id);
                        }
                    }
                }
                $items[] = [
                    'id'                  => $carrier->id,
                    'name'                => $carrier->name,
                    'cost'                => round($cost, 2),
                    'estimated_days_min'  => $carrier->transit_time,
                    'estimated_days_max'  => (int) $carrier->transit_time + 2,
                ];
            }

            return response()->json([
                'success' => true,
                'data'    => ['items' => $items],
            ]);
        }

        // ── Non-carrier shipping types ─────────────────────────────────────────
        if (!$user || $addressId <= 0) {
            $cost = $this->calculateGuestNonCarrierShippingCost($request, $stateName);

            return response()->json([
                'success' => true,
                'data' => [
                    'items' => [[
                        'id' => 1,
                        'name' => 'Home Delivery',
                        'cost' => round($cost, 2),
                        'estimated_days_min' => 3,
                        'estimated_days_max' => 7,
                    ]],
                ],
            ]);
        }

        $this->prepareCartForCheckout($user, $addressId, 0);
        $summary = $this->buildSummary($user);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => [[
                    'id' => 1,
                    'name' => 'Home Delivery',
                    'cost' => $summary['shipping_cost'],
                    'estimated_days_min' => 3,
                    'estimated_days_max' => 7,
                ]],
            ],
        ]);
    }

    public function validateCheckout(Request $request): JsonResponse
    {
        $user = $this->ensureAuthenticatedCustomer($request);
        $payload = $request->validate([
            'address_id' => ['required', 'integer'],
            'shipping_method_id' => ['required', 'integer'],
        ]);

        $this->prepareCartForCheckout($user, (int) $payload['address_id'], (int) $payload['shipping_method_id']);

        return response()->json([
            'success' => true,
            'data' => [
                'valid' => true,
                'errors' => [],
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $this->ensureAuthenticatedCustomer($request);
        $payload = $request->validate([
            'address_id' => ['required', 'integer'],
            'shipping_method_id' => ['required', 'integer'],
        ]);

        $this->prepareCartForCheckout($user, (int) $payload['address_id'], (int) $payload['shipping_method_id']);

        return response()->json([
            'success' => true,
            'data' => $this->buildSummary($user),
        ]);
    }

    public function intent(Request $request): JsonResponse
    {
        $user = $this->ensureAuthenticatedCustomer($request);
        $payload = $request->validate([
            'gateway' => ['required', 'string'],
            'shipping_address_id' => ['required', 'integer'],
            'shipping_method_id' => ['required', 'integer'],
            'billing_same_as_shipping' => ['nullable', 'boolean'],
            'billing_address_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
        ]);

        $gateway = AllowedPaymentMethods::normalize($payload['gateway'] ?? '');

        if (! AllowedPaymentMethods::isAllowed($gateway)) {
            throw ValidationException::withMessages([
                'gateway' => ['Only Razorpay and PhonePe payments are available for checkout.'],
            ]);
        }

        $this->assertGatewayConfigured($gateway);
        $this->prepareCartForCheckout($user, (int) $payload['shipping_address_id'], (int) $payload['shipping_method_id']);

        $request->merge([
            'payment_type' => $gateway,
            'note' => $payload['notes'] ?? '',
        ]);

        $orderResponse = app(OrderController::class)->store($request);
        $orderData = $orderResponse->getData(true);

        if (!(bool) ($orderData['result'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $orderData['message'] ?? 'Unable to create the order',
            ], 422);
        }

        $combinedOrderId = (int) ($orderData['combined_order_id'] ?? 0);
        $combinedOrder = CombinedOrder::with('orders')->findOrFail($combinedOrderId);
        $orderNumber = optional($combinedOrder->orders->first())->code ?? ('ORD-' . $combinedOrderId);
        if ($gateway === 'phonepe') {
            $phonePeIntent = $this->createPhonePeIntent($combinedOrder, $user->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $combinedOrderId,
                    'order_number' => $orderNumber,
                    'gateway' => 'phonepe',
                    'status' => 'pending_payment',
                ] + $phonePeIntent,
            ]);
        }

        [$api, $keyId] = $this->razorpayApi();
        $amountMinor = max(100, (int) round((float) $combinedOrder->grand_total * 100));
        try {
            $razorpayOrder = $api->order->create([
                'receipt' => 'co-' . $combinedOrderId . '-' . now()->timestamp,
                'amount' => $amountMinor,
                'currency' => 'INR',
                'notes' => ['combined_order_id' => $combinedOrderId],
            ]);
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'gateway' => ['Unable to start Razorpay payment. Please check the gateway configuration and try again.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $combinedOrderId,
                'order_number' => $orderNumber,
                'gateway' => 'razorpay',
                'status' => 'pending_payment',
                'razorpay_order_id' => $razorpayOrder['id'] ?? null,
                'razorpay_key_id' => $keyId,
                'amount' => $amountMinor,
                'currency' => 'INR',
            ],
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $user = $this->ensureAuthenticatedCustomer($request);
        $payload = $request->validate([
            'order_id' => ['required', 'integer'],
            'gateway_payment_id' => ['required', 'string'],
            'gateway_order_id' => ['required', 'string'],
            'signature' => ['required', 'string'],
        ]);

        $combinedOrder = CombinedOrder::with('orders')
            ->where('id', (int) $payload['order_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$combinedOrder) {
            throw ValidationException::withMessages([
                'order_id' => ['The order could not be found for this customer.'],
            ]);
        }

        [$api] = $this->razorpayApi();
        $attributes = [
            'razorpay_order_id' => $payload['gateway_order_id'],
            'razorpay_payment_id' => $payload['gateway_payment_id'],
            'razorpay_signature' => $payload['signature'],
        ];

        $api->utility->verifyPaymentSignature($attributes);
        $payment = $api->payment->fetch($payload['gateway_payment_id']);

        if (($payment['status'] ?? null) !== 'captured') {
            $payment = $payment->capture(['amount' => $payment['amount']]);
        }

        $paymentDetails = json_encode([
            'id' => $payment['id'],
            'method' => $payment['method'],
            'amount' => $payment['amount'],
            'currency' => $payment['currency'],
        ]);

        checkout_done($combinedOrder->id, $paymentDetails);

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $combinedOrder->id,
                'order_number' => optional($combinedOrder->orders->first())->code ?? ('ORD-' . $combinedOrder->id),
                'status' => 'confirmed',
                'payment' => [
                    'status' => 'captured',
                ],
                'message' => 'Payment confirmed',
            ],
        ]);
    }

    private function ensureAuthenticatedCustomer(Request $request): User
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        return $user;
    }

    private function prepareCartForCheckout(User $user, int $addressId, int $carrierId = 0): void
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $user->id)
            ->first();

        if (!$address) {
            throw ValidationException::withMessages([
                'address_id' => ['The selected shipping address is invalid.'],
            ]);
        }

        $carts = Cart::where('user_id', $user->id)->active()->get();

        if ($carts->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => ['Cart is empty.'],
            ]);
        }

        $shippingInfo = [
            'country_id' => $address->country_id,
            'state_id' => $address->state_id,
            'city_id' => $address->city_id,
            'area_id' => $address->area_id,
        ];

        $shippingType = get_setting('shipping_type');

        foreach ($carts as $key => $cart) {
            $cart->address_id = $address->id;
            if (Schema::hasColumn('carts', 'shipping_type')) {
                $cart->shipping_type = $shippingType === 'carrier_wise_shipping' ? 'carrier' : 'home_delivery';
            }
            if (Schema::hasColumn('carts', 'pickup_point')) {
                $cart->pickup_point = 0;
            }
            if (Schema::hasColumn('carts', 'carrier_id')) {
                $cart->carrier_id = $shippingType === 'carrier_wise_shipping' ? $carrierId : 0;
            }
            $cart->shipping_cost = getShippingCost(
                $carts, $key, $shippingInfo,
                $shippingType === 'carrier_wise_shipping' ? $carrierId : ''
            );
            $cart->save();
        }
    }

    private function buildSummary(User $user): array
    {
        $items = Cart::where('user_id', $user->id)->active()->get();

        $subtotal = 0.0;
        $tax = 0.0;
        foreach ($items as $item) {
            $product = Product::find($item->product_id);
            if (!$product) {
                continue;
            }

            $subtotal += cart_product_price($item, $product, false, false) * $item->quantity;
            $tax += cart_product_tax($item, $product, false) * $item->quantity;
        }

        $shippingCost = (float) $items->sum('shipping_cost');
        $discountAmount = (float) $items->sum('discount');

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discountAmount, 2),
            'shipping_cost' => round($shippingCost, 2),
            'tax_amount' => round($tax, 2),
            'grand_total' => round(($subtotal + $tax + $shippingCost) - $discountAmount, 2),
        ];
    }

    private function razorpayApi(): array
    {
        $config = app(PaymentGatewayConfig::class)->razorpay();
        $keyId = (string) ($config['key_id'] ?? '');
        $keySecret = (string) ($config['key_secret'] ?? '');

        if ($keyId === '' || $keySecret === '') {
            throw ValidationException::withMessages([
                'gateway' => ['Razorpay credentials are not configured.'],
            ]);
        }

        return [new Api($keyId, $keySecret), $keyId];
    }

    private function assertGatewayConfigured(string $gateway): void
    {
        if (! app(PaymentGatewayConfig::class)->isEnabled($gateway)) {
            throw ValidationException::withMessages([
                'gateway' => [ucfirst($gateway) . ' is disabled in admin payment management.'],
            ]);
        }

        if ($gateway === 'razorpay') {
            $this->razorpayApi();
            return;
        }

        if ($gateway === 'phonepe') {
            if (! app(PaymentGatewayConfig::class)->hasCredentials('phonepe')) {
                throw ValidationException::withMessages([
                    'gateway' => ['PhonePe credentials are not configured in admin payment management.'],
                ]);
            }
        }
    }

    private function createPhonePeIntent(CombinedOrder $combinedOrder, int $userId): array
    {
        $config = app(PaymentGatewayConfig::class)->phonepe();
        $isSandbox = ($config['environment'] ?? 'sandbox') === 'sandbox';
        $baseUrl = rtrim((string) $config['base_url'], '/');
        $tokenUrl = $isSandbox
            ? $baseUrl . '/v1/oauth/token'
            : $baseUrl . '/identity-manager/v1/oauth/token';
        $payUrl = $isSandbox
            ? $baseUrl . '/checkout/v2/pay'
            : $baseUrl . '/pg/checkout/v2/pay';

        try {
            $tokenResponse = Http::asForm()->timeout((int) $config['timeout_seconds'])->post($tokenUrl, [
                'client_id' => $config['client_id'],
                'client_secret' => $config['client_secret'],
                'grant_type' => 'client_credentials',
                'client_version' => $config['client_version'],
            ]);
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'gateway' => ['Unable to connect to PhonePe. Please try again later.'],
            ]);
        }

        $tokenData = $tokenResponse->json() ?: [];
        if (! $tokenResponse->successful() || empty($tokenData['access_token'])) {
            throw ValidationException::withMessages([
                'gateway' => ['PhonePe authentication failed. Please check the gateway credentials.'],
            ]);
        }

        $merchantTransactionId = 'cart_payment-' . $combinedOrder->id . '-' . $userId . '-' . random_int(10000, 99999);
        $payload = [
            'merchantOrderId' => $merchantTransactionId,
            'merchantUserId' => (string) $userId,
            'amount' => max(100, (int) round((float) $combinedOrder->grand_total * 100)),
            'paymentFlow' => [
                'type' => 'PG_CHECKOUT',
                'message' => 'Proceeding with payment',
                'merchantUrls' => [
                    'redirectUrl' => $config['redirect_url'] ?: route('api.phonepe.redirecturl'),
                    'callbackUrl' => $config['callback_url'] ?: route('api.phonepe.callbackUrl'),
                ],
            ],
            'metaInfo' => [
                'userId' => (string) $userId,
                'paymentType' => 'cart_payment',
                'combinedOrderId' => (string) $combinedOrder->id,
            ],
        ];

        try {
            $payResponse = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'O-Bearer ' . $tokenData['access_token'],
            ])->timeout((int) $config['timeout_seconds'])->post($payUrl, $payload);
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'gateway' => ['Unable to start PhonePe payment. Please try again later.'],
            ]);
        }

        $payData = $payResponse->json() ?: [];
        $redirectUrl = $payData['redirectUrl'] ?? $payData['data']['redirectUrl'] ?? null;
        if (! $payResponse->successful() || ! $redirectUrl) {
            throw ValidationException::withMessages([
                'gateway' => ['PhonePe payment link could not be created. Please check the gateway configuration.'],
            ]);
        }

        return [
            'payment_url' => $redirectUrl,
            'redirect_url' => $redirectUrl,
            'phonepe_order_id' => $payData['orderId'] ?? $payData['data']['orderId'] ?? null,
            'merchant_transaction_id' => $merchantTransactionId,
        ];
    }

    private function calculateGuestNonCarrierShippingCost(Request $request, string $stateName): float
    {
        $tempUserId = $request->input('cart_token');
        if (!$tempUserId) {
            return 0;
        }

        $carts = Cart::where('temp_user_id', $tempUserId)->active()->get();
        if ($carts->isEmpty()) {
            return 0;
        }

        $stateId = null;
        if ($stateName !== '') {
            $stateId = State::where('name', $stateName)->value('id');
        }

        $shippingInfo = [
            'country_id' => 1,
            'state_id' => $stateId,
            'city_id' => null,
            'area_id' => null,
        ];

        $totalCost = 0;
        foreach ($carts as $key => $cart) {
            $totalCost += getShippingCost($carts, $key, $shippingInfo, '');
        }

        return (float) $totalCost;
    }
}
