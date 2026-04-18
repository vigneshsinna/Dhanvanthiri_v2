<?php

namespace App\Http\Controllers\Api\V2;

use App\Support\GuestCheckout\GuestCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestAccountClaimController extends Controller
{
    public function claim(Request $request, GuestCheckoutService $guestCheckoutService): JsonResponse
    {
        $payload = $request->validate([
            'guest_checkout_token' => ['nullable', 'string'],
            'order_access_token' => ['nullable', 'string'],
            'order_number' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $guestCheckoutService->claimAccount($payload),
        ]);
    }
}
