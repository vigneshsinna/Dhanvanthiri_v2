<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CombinedOrder;
use App\Models\Product;
use App\Models\User;
use App\Support\Checkout\AllowedPaymentMethods;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Razorpay\Api\Api;
use Throwable;

class StorefrontCheckoutBridgeController extends Controller
{
    public function shippingRates(Request $request): JsonResponse
    {
        $addressId = (int) $request->input('address_id', 0);
        $user = $request->user();

        if (!$user || $addressId <= 0) {
            return response()->json([
                'success' => true,
                'data' => [
                    'items' => [[
                        'id' => 1,
                        'name' => 'Home Delivery',
                        'cost' => 0,
                        'estimated_days_min' => 3,
                        'estimated_days_max' => 7,
                    ]],
                ],
            ]);
        }

        $this->prepareCartForCheckout($user, $addressId);
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

        $this->prepareCartForCheckout($user, (int) $payload['address_id']);

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

        $this->prepareCartForCheckout($user, (int) $payload['address_id']);

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
        $this->prepareCartForCheckout($user, (int) $payload['shipping_address_id']);

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

    private function prepareCartForCheckout(User $user, int $addressId): void
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
            'city_id' => $address->city_id,
            'area_id' => $address->area_id,
        ];

        foreach ($carts as $key => $cart) {
            $cart->address_id = $address->id;
            if (Schema::hasColumn('carts', 'shipping_type')) {
                $cart->shipping_type = 'home_delivery';
            }
            if (Schema::hasColumn('carts', 'pickup_point')) {
                $cart->pickup_point = 0;
            }
            if (Schema::hasColumn('carts', 'carrier_id')) {
                $cart->carrier_id = 0;
            }
            $cart->shipping_cost = getShippingCost($carts, $key, $shippingInfo);
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
        $keyId = (string) env('RAZOR_KEY', '');
        $keySecret = (string) env('RAZOR_SECRET', '');

        if ($keyId === '' || $keySecret === '') {
            throw ValidationException::withMessages([
                'gateway' => ['Razorpay credentials are not configured.'],
            ]);
        }

        return [new Api($keyId, $keySecret), $keyId];
    }

    private function assertGatewayConfigured(string $gateway): void
    {
        if ($gateway === 'razorpay') {
            $this->razorpayApi();
            return;
        }

        if ($gateway === 'phonepe') {
            $missing = [];
            foreach (['PHONEPE_CLIENT_ID', 'PHONEPE_CLIENT_SECRET', 'PHONEPE_CLIENT_VERSION'] as $key) {
                if ((string) env($key, '') === '') {
                    $missing[] = $key;
                }
            }

            if ($missing !== []) {
                throw ValidationException::withMessages([
                    'gateway' => ['PhonePe credentials are not configured. Missing: ' . implode(', ', $missing) . '.'],
                ]);
            }
        }
    }

    private function createPhonePeIntent(CombinedOrder $combinedOrder, int $userId): array
    {
        $isSandbox = (int) get_setting('phonepe_sandbox', 0) === 1;
        $tokenUrl = $isSandbox
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
            : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
        $payUrl = $isSandbox
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay'
            : 'https://api.phonepe.com/apis/pg/checkout/v2/pay';

        try {
            $tokenResponse = Http::asForm()->timeout(20)->post($tokenUrl, [
                'client_id' => env('PHONEPE_CLIENT_ID'),
                'client_secret' => env('PHONEPE_CLIENT_SECRET'),
                'grant_type' => 'client_credentials',
                'client_version' => env('PHONEPE_CLIENT_VERSION'),
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
                    'redirectUrl' => route('api.phonepe.redirecturl'),
                    'callbackUrl' => route('api.phonepe.callbackUrl'),
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
            ])->timeout(20)->post($payUrl, $payload);
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
}
