<?php

namespace App\Http\Controllers\Api\V2;

use App\Support\GuestCheckout\GuestCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class GuestCheckoutController extends Controller
{
    public function validateCheckout(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $shippingAddress = (array) $request->input('shipping_address', []);
        $line1 = $shippingAddress['line1'] ?? $request->input('line1');
        $line2 = $shippingAddress['line2'] ?? $request->input('line2');

        $request->merge([
            'temp_user_id' => $request->input('temp_user_id', $request->input('cart_token')),
            'name' => $request->input('name', $request->input('recipient_name', $shippingAddress['recipient_name'] ?? null)),
            'email' => $request->input('email', $request->input('guest_email')),
            'address' => $request->input('address', trim(implode(', ', array_filter([$line1, $line2])))),
            'country_id' => $request->input('country_id'),
            'state_id' => $request->input('state_id'),
            'city_id' => $request->input('city_id'),
            'country_name' => $request->input('country_name', $request->input('country', $request->input('country_code'))),
            'state_name' => $request->input('state_name', $request->input('state')),
            'city_name' => $request->input('city_name', $request->input('city')),
            'postal_code' => $request->input('postal_code', $shippingAddress['postal_code'] ?? null),
            'phone' => $request->input('phone', $request->input('guest_phone', $shippingAddress['phone'] ?? null)),
            'shipping_method_id' => $request->input('shipping_method_id'),
        ]);

        $payload = $request->validate([
            'temp_user_id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'address' => ['required', 'string'],
            'country_id' => ['nullable', 'integer'],
            'state_id' => ['nullable', 'integer'],
            'city_id' => ['nullable', 'integer'],
            'country_name' => ['nullable', 'string'],
            'state_name' => ['nullable', 'string'],
            'city_name' => ['nullable', 'string'],
            'postal_code' => ['required', 'string'],
            'phone' => ['required', 'string'],
            'shipping_method_id' => ['nullable', 'integer'],
        ]);

        $validatedCheckout = $guestCheckoutService->validate($payload);

        return response()->json([
            'success' => true,
            'data' => [
                'guest_checkout_token' => $validatedCheckout['guest_checkout_token'],
                'expires_at' => $validatedCheckout['expires_at'],
            ],
        ]);
    }

    public function summary(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'guest_checkout_token' => ['required', 'string'],
            'shipping_method_id' => ['nullable', 'integer'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->summary((string) $payload['guest_checkout_token'], (int) ($payload['shipping_method_id'] ?? 0)),
        ]);
    }

    public function paymentIntent(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'guest_checkout_token' => ['required', 'string'],
            'gateway' => ['required', 'string'],
            'shipping_method_id' => ['nullable', 'integer'],
        ]);

        try {
            $data = $guestCheckoutService->createPaymentIntent($payload);
        } catch (Throwable $throwable) {
            if ($throwable instanceof \Illuminate\Validation\ValidationException) {
                throw $throwable;
            }

            report($throwable);

            return response()->json([
                'success' => false,
                'message' => 'Unable to initiate payment. Please try again.',
                'error' => [
                    'code' => 'PAYMENT_INTENT_FAILED',
                ],
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function confirmPayment(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'guest_checkout_token' => ['required', 'string'],
            'order_id' => ['required', 'integer'],
            'gateway_payment_id' => ['required', 'string'],
            'gateway_order_id' => ['required', 'string'],
            'signature' => ['required', 'string'],
        ]);

        try {
            $data = $guestCheckoutService->confirmPayment($payload);
        } catch (Throwable $throwable) {
            if ($throwable instanceof \Illuminate\Validation\ValidationException) {
                throw $throwable;
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => [
                    'code' => 'PAYMENT_VERIFICATION_FAILED',
                ],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
