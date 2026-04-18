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
        $payload = $request->validate([
            'temp_user_id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'address' => ['required', 'string'],
            'country_id' => ['required', 'integer'],
            'state_id' => ['nullable', 'integer'],
            'city_id' => ['required', 'integer'],
            'postal_code' => ['required', 'string'],
            'phone' => ['required', 'string'],
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
        ]);

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->summary((string) $payload['guest_checkout_token']),
        ]);
    }

    public function paymentIntent(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'guest_checkout_token' => ['required', 'string'],
            'gateway' => ['required', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->createPaymentIntent($payload),
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
