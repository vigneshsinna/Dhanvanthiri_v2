<?php

namespace App\Http\Controllers\Api\V2;

use App\Support\GuestCheckout\GuestCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GuestOrderAccessController extends Controller
{
    public function track(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'order_number' => ['required', 'string'],
            'guest_checkout_token' => ['nullable', 'string'],
            'order_access_token' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
        ]);

        if (
            empty($payload['guest_checkout_token'])
            && empty($payload['order_access_token'])
            && empty($payload['email'])
            && empty($payload['phone'])
        ) {
            throw ValidationException::withMessages([
                'email' => ['Provide a valid email, phone, or guest access token.'],
                'phone' => ['Provide a valid email, phone, or guest access token.'],
            ]);
        }

        try {
            $result = $guestCheckoutService->resolveTrackableOrder($payload);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Order access could not be verified.',
                'error' => [
                    'code' => 'NOT_FOUND',
                ],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->formatOrderForTracking($result['order']) + [
                'order_access_token' => $result['order_access_token'],
                'order_access_expires_at' => $result['order_access_expires_at'],
            ],
        ]);
    }

    public function show(Request $request, string $orderNumber, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        try {
            $order = $guestCheckoutService->resolveOrderForDetail(
                $orderNumber,
                $request->query('guest_checkout_token'),
                $request->query('order_access_token')
            );
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Order access could not be verified.',
                'error' => [
                    'code' => 'NOT_FOUND',
                ],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->formatOrderForDetail($order),
        ]);
    }
}
