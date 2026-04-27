<?php

namespace App\Support\GuestCheckout;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CombinedOrder;
use App\Models\GuestCheckoutSession;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Razorpay\Api\Api;

class GuestCheckoutService
{
    private const CHECKOUT_SESSION_TTL_HOURS = 2;
    private const ORDER_ACCESS_TTL_HOURS = 24;

    public function validate(array $payload): array
    {
        $tempUserId = (string) $payload['temp_user_id'];

        $guestUser = $this->resolveGuestUser($payload);
        $expiresAt = now()->addHours(self::CHECKOUT_SESSION_TTL_HOURS)->startOfSecond();
        $plainToken = Str::random(64);

        $session = DB::transaction(function () use ($guestUser, $payload, $tempUserId, $expiresAt, $plainToken) {
            $session = GuestCheckoutSession::query()
                ->where('guest_user_id', $guestUser->id)
                ->where('temp_user_id', $tempUserId)
                ->latest('id')
                ->first() ?? new GuestCheckoutSession();

            $address = $this->upsertGuestAddress($guestUser, $payload);
            $this->bindCartToGuestUser($guestUser, $address, $tempUserId);

            $session->fill([
                'guest_user_id' => $guestUser->id,
                'temp_user_id' => $tempUserId,
                'guest_checkout_token_hash' => hash('sha256', $plainToken),
                'status' => GuestCheckoutSession::STATUS_CART_BOUND,
                'expires_at' => $expiresAt,
            ]);
            $session->save();

            return $session;
        });

        return [
            'guest_checkout_token' => $plainToken,
            'expires_at' => $expiresAt->toISOString(),
            'session' => $session,
            'guest_user' => $guestUser,
        ];
    }

    public function summary(string $plainToken): array
    {
        $session = $this->resolveCheckoutSession($plainToken);
        $items = $this->activeGuestCart($session->guestUser);

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'guest_checkout_token' => ['The guest checkout session no longer has an active cart.'],
            ]);
        }

        return $this->buildCartTotals($items);
    }

    public function createPaymentIntent(array $payload): array
    {
        $session = $this->resolveCheckoutSessionForPayment((string) $payload['guest_checkout_token']);
        $gateway = strtolower((string) $payload['gateway']);

        if ($gateway === 'wallet') {
            throw ValidationException::withMessages([
                'gateway' => ['Wallet checkout requires a signed-in customer account.'],
            ]);
        }

        $combinedOrder = $this->ensureCombinedOrder($session, $gateway);
        $orderNumber = $this->resolveOrderNumber($combinedOrder);
        $orderAccess = $this->issueOrderAccessToken($session, $orderNumber);

        if ($gateway === 'cash_on_delivery' || $gateway === 'cod') {
            $session->forceFill([
                'status' => GuestCheckoutSession::STATUS_ORDER_COMPLETED,
                'order_code' => $orderNumber,
            ])->save();

            return [
                'order_id' => $combinedOrder->id,
                'order_number' => $orderNumber,
                'gateway' => 'cash_on_delivery',
                'status' => 'confirmed',
                'payment_status' => 'cod',
                'order_access_token' => $orderAccess['token'],
                'order_access_expires_at' => $orderAccess['expires_at'],
            ];
        }

        if ($gateway !== 'razorpay') {
            $session->forceFill([
                'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
                'order_code' => $orderNumber,
            ])->save();

            return [
                'order_id' => $combinedOrder->id,
                'order_number' => $orderNumber,
                'gateway' => $gateway,
                'status' => 'pending_payment',
                'order_access_token' => $orderAccess['token'],
                'order_access_expires_at' => $orderAccess['expires_at'],
            ];
        }

        [$api, $keyId] = $this->razorpayApi();
        $amountMinor = max(100, (int) round((float) $combinedOrder->grand_total * 100));
        $razorpayOrder = $api->order->create([
            'receipt' => 'guest-' . $combinedOrder->id . '-' . now()->timestamp,
            'amount' => $amountMinor,
            'currency' => 'INR',
            'notes' => ['combined_order_id' => $combinedOrder->id],
        ]);

        $session->forceFill([
            'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
            'order_code' => $orderNumber,
        ])->save();

        return [
            'order_id' => $combinedOrder->id,
            'order_number' => $orderNumber,
            'gateway' => 'razorpay',
            'status' => 'pending_payment',
            'razorpay_order_id' => $razorpayOrder['id'] ?? null,
            'razorpay_key_id' => $keyId,
            'amount' => $amountMinor,
            'currency' => 'INR',
            'order_access_token' => $orderAccess['token'],
            'order_access_expires_at' => $orderAccess['expires_at'],
        ];
    }

    public function confirmPayment(array $payload): array
    {
        $session = $this->resolveCheckoutSessionForPayment((string) $payload['guest_checkout_token']);
        $combinedOrder = CombinedOrder::with('orders')->findOrFail((int) $payload['order_id']);

        if ((int) $session->combined_order_id !== (int) $combinedOrder->id) {
            throw ValidationException::withMessages([
                'order_id' => ['The order could not be matched to this guest checkout session.'],
            ]);
        }

        if ($this->isCombinedOrderPaid($combinedOrder)) {
            $session->forceFill([
                'status' => GuestCheckoutSession::STATUS_ORDER_COMPLETED,
                'order_code' => $this->resolveOrderNumber($combinedOrder),
            ])->save();

            return $this->buildConfirmedPaymentPayload($session, $combinedOrder, [
                'status' => 'captured',
                'duplicate' => true,
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

        DB::transaction(function () use ($combinedOrder, $session, $paymentDetails): void {
            foreach ($combinedOrder->orders as $order) {
                $order->payment_status = 'paid';
                $order->payment_details = $paymentDetails;
                $order->save();
            }

            $session->status = GuestCheckoutSession::STATUS_PAYMENT_AUTHORIZED;
            $session->save();

            $session->status = GuestCheckoutSession::STATUS_ORDER_COMPLETED;
            $session->order_code = $this->resolveOrderNumber($combinedOrder);
            $session->save();
        });

        return $this->buildConfirmedPaymentPayload($session->fresh(), $combinedOrder->fresh('orders'), [
            'status' => 'captured',
        ]);
    }

    public function claimAccount(array $payload): array
    {
        $user = $this->resolveGuestUserForClaim(
            $payload['guest_checkout_token'] ?? null,
            $payload['order_access_token'] ?? null,
            $payload['order_number'] ?? null
        );

        if (! $user->is_guest || $user->account_claimed_at !== null) {
            throw ValidationException::withMessages([
                'guest_checkout_token' => ['This guest checkout has already been claimed.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make((string) $payload['password']),
            'is_guest' => false,
            'account_claimed_at' => now(),
        ]);
        $user->save();

        return [
            'user_id' => $user->id,
            'email' => $user->email,
            'claimed_at' => optional($user->account_claimed_at)->toISOString(),
        ];
    }

    public function resolveTrackableOrder(array $payload): array
    {
        $orderNumber = (string) ($payload['order_number'] ?? '');
        $order = $this->findOrderByNumber($orderNumber);

        if (! $order) {
            throw ValidationException::withMessages([
                'order_number' => ['Order access could not be verified.'],
            ]);
        }

        if ($this->canAccessOrderWithGuestToken($payload['guest_checkout_token'] ?? null, $order)
            || $this->canAccessOrderWithOrderAccessToken($payload['order_access_token'] ?? null, $orderNumber)
            || $this->matchesGuestIdentity($order, $payload['email'] ?? null, $payload['phone'] ?? null)
        ) {
            $session = GuestCheckoutSession::query()
                ->where('guest_user_id', $order->user_id)
                ->where('order_code', $orderNumber)
                ->latest('id')
                ->first();

            $orderAccess = $this->issueOrderAccessToken($session, $orderNumber);

            return [
                'order' => $order,
                'order_access_token' => $orderAccess['token'],
                'order_access_expires_at' => $orderAccess['expires_at'],
            ];
        }

        throw ValidationException::withMessages([
            'order_number' => ['Order access could not be verified.'],
        ]);
    }

    public function resolveOrderForDetail(string $orderNumber, ?string $guestCheckoutToken = null, ?string $orderAccessToken = null): Order
    {
        $order = $this->findOrderByNumber($orderNumber);

        if (! $order) {
            throw ValidationException::withMessages([
                'order_number' => ['Order access could not be verified.'],
            ]);
        }

        $authUser = Auth::user();
        if ($authUser && (int) $authUser->id === (int) $order->user_id) {
            return $order;
        }

        if ($this->canAccessOrderWithGuestToken($guestCheckoutToken, $order)
            || $this->canAccessOrderWithOrderAccessToken($orderAccessToken, $orderNumber)
        ) {
            return $order;
        }

        throw ValidationException::withMessages([
            'order_number' => ['Order access could not be verified.'],
        ]);
    }

    public function formatOrderForTracking(Order $order): array
    {
        $shippingAddress = $this->normalizeShippingAddress($order);

        return [
            'id' => $order->id,
            'order_number' => $order->code,
            'status' => $this->resolveOrderStatus($order),
            'payment_status' => $order->payment_status,
            'grand_total' => (float) $order->grand_total,
            'currency' => 'INR',
            'created_at' => $this->orderTimestamp($order),
            'items' => $order->orderDetails->map(function ($detail): array {
                $quantity = max(1, (int) $detail->quantity);
                $lineTotal = (float) $detail->price;

                return [
                    'product_name' => optional($detail->product)->name ?? ('Item #' . $detail->product_id),
                    'sku' => $detail->variation ?: '',
                    'quantity' => $quantity,
                    'unit_price' => round($lineTotal / $quantity, 2),
                    'line_total' => round($lineTotal, 2),
                    'product_image_url' => optional(optional($detail->product)->thumbnail)->file_name,
                ];
            })->values()->all(),
            'shipping_address' => $shippingAddress,
            'shipments' => [],
            'status_history' => [[
                'from_status' => null,
                'to_status' => $this->resolveOrderStatus($order),
                'note' => null,
                'created_at' => $this->orderTimestamp($order),
            ]],
        ];
    }

    public function formatOrderForDetail(Order $order): array
    {
        $tracking = $this->formatOrderForTracking($order);
        $paymentDetails = json_decode((string) $order->payment_details, true) ?: null;
        $discountAmount = (float) ($order->coupon_discount ?? 0);
        $shippingCost = (float) $order->orderDetails->sum('shipping_cost');
        $taxAmount = (float) $order->orderDetails->sum('tax');
        $subtotal = max(0.0, ((float) $order->grand_total + $discountAmount) - $shippingCost - $taxAmount);

        return $tracking + [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discountAmount, 2),
            'shipping_cost' => round($shippingCost, 2),
            'tax_amount' => round($taxAmount, 2),
            'payment' => $paymentDetails ? [
                'gateway' => $order->payment_type,
                'status' => $order->payment_status,
                'details' => $paymentDetails,
            ] : null,
        ];
    }

    private function resolveCheckoutSession(string $plainToken): GuestCheckoutSession
    {
        $session = $this->findCheckoutSessionByToken($plainToken);

        if (! $session) {
            throw ValidationException::withMessages([
                'guest_checkout_token' => ['The guest checkout session is invalid.'],
            ]);
        }

        if ($session->expires_at->isPast()) {
            $session->status = GuestCheckoutSession::STATUS_EXPIRED;
            $session->save();

            throw ValidationException::withMessages([
                'guest_checkout_token' => ['The guest checkout session has expired. Please restart checkout.'],
            ]);
        }

        return $session->loadMissing('guestUser');
    }

    private function resolveCheckoutSessionForPayment(string $plainToken): GuestCheckoutSession
    {
        $session = $this->findCheckoutSessionByToken($plainToken);

        if (! $session) {
            throw ValidationException::withMessages([
                'guest_checkout_token' => ['The guest checkout session is invalid.'],
            ]);
        }

        if ($session->expires_at->isPast()) {
            if ($session->combined_order_id && in_array($session->status, [
                GuestCheckoutSession::STATUS_PAYMENT_PENDING,
                GuestCheckoutSession::STATUS_PAYMENT_AUTHORIZED,
                GuestCheckoutSession::STATUS_ORDER_COMPLETED,
            ], true)) {
                $session->expires_at = now()->addHours(self::CHECKOUT_SESSION_TTL_HOURS)->startOfSecond();
                $session->save();
            } else {
                $session->status = GuestCheckoutSession::STATUS_EXPIRED;
                $session->save();

                throw ValidationException::withMessages([
                    'guest_checkout_token' => ['The guest checkout session has expired. Please restart checkout.'],
                ]);
            }
        }

        return $session->loadMissing('guestUser');
    }

    private function findCheckoutSessionByToken(string $plainToken): ?GuestCheckoutSession
    {
        if ($plainToken === '') {
            return null;
        }

        return GuestCheckoutSession::query()
            ->with('guestUser')
            ->where('guest_checkout_token_hash', hash('sha256', $plainToken))
            ->latest('id')
            ->first();
    }

    private function activeGuestCart(User $guestUser): Collection
    {
        return Cart::query()
            ->where('user_id', $guestUser->id)
            ->active()
            ->get();
    }

    private function buildCartTotals(Collection $items): array
    {
        $subtotal = 0.0;
        $tax = 0.0;

        foreach ($items as $item) {
            $subtotal += (float) $item->price * (int) $item->quantity;
            $tax += (float) $item->tax * (int) $item->quantity;
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

    private function ensureCombinedOrder(GuestCheckoutSession $session, string $gateway): CombinedOrder
    {
        if ($session->combined_order_id) {
            $existing = CombinedOrder::with('orders')->find($session->combined_order_id);

            if ($existing) {
                $session->forceFill([
                    'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
                    'order_code' => $this->resolveOrderNumber($existing),
                ])->save();

                return $existing;
            }
        }

        $combinedOrder = $this->createCombinedOrderForGuestSession($session->guestUser, $gateway);

        $session->forceFill([
            'combined_order_id' => $combinedOrder->id,
            'order_code' => $this->resolveOrderNumber($combinedOrder),
            'status' => GuestCheckoutSession::STATUS_PAYMENT_PENDING,
        ])->save();

        return $combinedOrder;
    }

    private function createCombinedOrderForGuestSession(User $guestUser, string $gateway): CombinedOrder
    {
        $request = Request::create('/api/v2/order/store', 'POST', [
            'payment_type' => $gateway,
        ]);

        $previousUser = Auth::user();
        Auth::setUser($guestUser);

        try {
            $response = app(\App\Http\Controllers\Api\V2\OrderController::class)->store($request);
        } finally {
            Auth::forgetGuards();
            if ($previousUser) {
                Auth::setUser($previousUser);
            }
        }

        $payload = $response->getData(true);

        if (! (bool) ($payload['result'] ?? false)) {
            throw ValidationException::withMessages([
                'cart' => [$payload['message'] ?? 'Unable to create the order.'],
            ]);
        }

        return CombinedOrder::with('orders')->findOrFail((int) $payload['combined_order_id']);
    }

    private function buildConfirmedPaymentPayload(GuestCheckoutSession $session, CombinedOrder $combinedOrder, array $payment): array
    {
        $orderNumber = $this->resolveOrderNumber($combinedOrder);
        $orderAccess = $this->issueOrderAccessToken($session, $orderNumber);

        return [
            'order_id' => $combinedOrder->id,
            'order_number' => $orderNumber,
            'status' => 'confirmed',
            'payment' => $payment,
            'order_access_token' => $orderAccess['token'],
            'order_access_expires_at' => $orderAccess['expires_at'],
            'message' => 'Payment confirmed',
        ];
    }

    private function resolveGuestUserForClaim(?string $guestCheckoutToken, ?string $orderAccessToken, ?string $orderNumber): User
    {
        if ($guestCheckoutToken) {
            return $this->resolveCheckoutSessionForPayment($guestCheckoutToken)->guestUser;
        }

        if ($orderAccessToken && $orderNumber && $this->canAccessOrderWithOrderAccessToken($orderAccessToken, $orderNumber)) {
            $order = $this->findOrderByNumber($orderNumber);

            return User::findOrFail($order->user_id);
        }

        throw ValidationException::withMessages([
            'guest_checkout_token' => ['A valid guest session or order access token is required.'],
        ]);
    }

    private function issueOrderAccessToken(?GuestCheckoutSession $session, string $orderNumber): array
    {
        $guestUserId = (int) ($session?->guest_user_id ?? 0);
        $expiresAt = now()->addHours(self::ORDER_ACCESS_TTL_HOURS)->startOfSecond();
        $payload = [
            'order_number' => $orderNumber,
            'guest_user_id' => $guestUserId,
            'exp' => $expiresAt->timestamp,
        ];

        $body = $this->base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $body, (string) config('app.key'));

        return [
            'token' => $body . '.' . $signature,
            'expires_at' => $expiresAt->toISOString(),
        ];
    }

    private function canAccessOrderWithOrderAccessToken(?string $token, string $orderNumber): bool
    {
        if (! $token || ! str_contains($token, '.')) {
            return false;
        }

        [$body, $signature] = explode('.', $token, 2);
        $expectedSignature = hash_hmac('sha256', $body, (string) config('app.key'));

        if (! hash_equals($expectedSignature, $signature)) {
            return false;
        }

        $payload = json_decode($this->base64UrlDecode($body), true);

        if (! is_array($payload)) {
            return false;
        }

        if (($payload['order_number'] ?? null) !== $orderNumber) {
            return false;
        }

        return now()->timestamp <= (int) ($payload['exp'] ?? 0);
    }

    private function canAccessOrderWithGuestToken(?string $token, Order $order): bool
    {
        if (! $token) {
            return false;
        }

        $session = $this->findCheckoutSessionByToken($token);

        if (! $session || $session->expires_at->isPast()) {
            return false;
        }

        return (int) $session->guest_user_id === (int) $order->user_id
            && ($session->order_code === null || $session->order_code === $order->code);
    }

    private function matchesGuestIdentity(Order $order, ?string $email, ?string $phone): bool
    {
        $guestUser = User::find($order->user_id);

        if (! $guestUser || ! $guestUser->is_guest) {
            return false;
        }

        $shippingAddress = $this->decodeShippingAddress($order);
        $candidateEmail = trim(Str::lower((string) $email));
        $candidatePhone = $this->normalizePhone($phone);

        $knownEmail = trim(Str::lower((string) ($shippingAddress['email'] ?? $guestUser->email)));
        $knownPhone = $this->normalizePhone($phone ? ($shippingAddress['phone'] ?? $guestUser->phone) : null);

        return ($candidateEmail !== '' && $candidateEmail === $knownEmail)
            || ($candidatePhone !== '' && $candidatePhone === $knownPhone);
    }

    private function findOrderByNumber(string $orderNumber): ?Order
    {
        return Order::query()
            ->with(['orderDetails.product.thumbnail'])
            ->where('code', $orderNumber)
            ->first();
    }

    private function normalizeShippingAddress(Order $order): ?array
    {
        $shippingAddress = $this->decodeShippingAddress($order);

        if ($shippingAddress === []) {
            return null;
        }

        return [
            'recipient_name' => $shippingAddress['name'] ?? null,
            'email' => $shippingAddress['email'] ?? null,
            'line1' => $shippingAddress['address'] ?? null,
            'line_1' => $shippingAddress['address'] ?? null,
            'city' => $shippingAddress['city'] ?? null,
            'state' => $shippingAddress['state'] ?? null,
            'country' => $shippingAddress['country'] ?? null,
            'postal_code' => $shippingAddress['postal_code'] ?? null,
            'phone' => $shippingAddress['phone'] ?? null,
        ];
    }

    private function decodeShippingAddress(Order $order): array
    {
        $shippingAddress = $order->shipping_address;

        if (is_array($shippingAddress)) {
            return $shippingAddress;
        }

        if (! is_string($shippingAddress) || trim($shippingAddress) === '') {
            return [];
        }

        return json_decode($shippingAddress, true) ?: [];
    }

    private function resolveOrderStatus(Order $order): string
    {
        if ($order->delivery_status) {
            return (string) $order->delivery_status;
        }

        return $order->payment_status === 'paid' ? 'confirmed' : 'pending_payment';
    }

    private function orderTimestamp(Order $order): string
    {
        if ($order->created_at) {
            return Carbon::parse($order->created_at)->toISOString();
        }

        if ($order->date) {
            return Carbon::createFromTimestamp((int) $order->date)->toISOString();
        }

        return now()->toISOString();
    }

    private function resolveOrderNumber(CombinedOrder $combinedOrder): string
    {
        return optional($combinedOrder->orders->first())->code ?? ('ORD-' . $combinedOrder->id);
    }

    private function isCombinedOrderPaid(CombinedOrder $combinedOrder): bool
    {
        return $combinedOrder->orders->isNotEmpty()
            && $combinedOrder->orders->every(fn (Order $order): bool => $order->payment_status === 'paid');
    }

    private function normalizePhone(?string $phone): string
    {
        return preg_replace('/\D+/', '', (string) $phone) ?: '';
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4)) ?: '';
    }

    private function resolveGuestUser(array $payload): User
    {
        $email = (string) $payload['email'];

        $existingUser = User::where('email', $email)->first();

        if ($existingUser && (! $existingUser->is_guest || $existingUser->account_claimed_at !== null)) {
            throw ValidationException::withMessages([
                'email' => ['Please sign in to continue with your existing account.'],
            ]);
        }

        if ($existingUser) {
            $existingUser->forceFill([
                'name' => $payload['name'],
                'phone' => $payload['phone'],
                'address' => $payload['address'],
                'city' => $payload['city_name'] ?? null,
                'postal_code' => $payload['postal_code'],
                'country' => $payload['country_name'] ?? null,
            ]);
            $existingUser->save();

            return $existingUser;
        }

        $guestUser = new User();
        $guestUser->forceFill([
            'name' => $payload['name'],
            'email' => $email,
            'phone' => $payload['phone'],
            'address' => $payload['address'],
            'city' => $payload['city_name'] ?? null,
            'postal_code' => $payload['postal_code'],
            'country' => $payload['country_name'] ?? null,
            'password' => bcrypt(Str::random(32)),
            'user_type' => 'customer',
            'is_guest' => true,
        ]);
        $guestUser->save();

        return $guestUser;
    }

    private function upsertGuestAddress(User $guestUser, array $payload): Address
    {
        $address = Address::firstOrNew([
            'user_id' => $guestUser->id,
        ]);

        $addressData = [
            'user_id' => $guestUser->id,
            'address' => $payload['address'],
            'country_id' => $payload['country_id'],
            'state_id' => $payload['state_id'] ?? null,
            'city_id' => $payload['city_id'],
            'postal_code' => $payload['postal_code'],
            'phone' => $payload['phone'],
            'set_default' => 1,
        ];

        foreach (['country_name', 'state_name', 'city_name'] as $column) {
            if (Schema::hasColumn('addresses', $column)) {
                $addressData[$column] = $payload[$column] ?? null;
            }
        }

        $address->forceFill($addressData);
        $address->save();

        return $address;
    }

    private function bindCartToGuestUser(User $guestUser, Address $address, string $tempUserId): void
    {
        $tempCartQuery = Cart::where('temp_user_id', $tempUserId)->where('status', 1);

        if ($tempCartQuery->exists()) {
            $tempCartQuery->update([
                'user_id' => $guestUser->id,
                'temp_user_id' => null,
                'address_id' => $address->id,
            ]);

            $this->applyHomeDeliveryShipping($guestUser, $address);

            return;
        }

        $guestCartQuery = Cart::where('user_id', $guestUser->id)->where('status', 1);

        if ($guestCartQuery->exists()) {
            $guestCartQuery->update([
                'address_id' => $address->id,
            ]);

            $this->applyHomeDeliveryShipping($guestUser, $address);

            return;
        }

        throw ValidationException::withMessages([
            'temp_user_id' => ['A guest cart is required before checkout can continue.'],
        ]);
    }

    private function applyHomeDeliveryShipping(User $guestUser, Address $address): void
    {
        $carts = Cart::where('user_id', $guestUser->id)->active()->get();

        $shippingInfo = [
            'country_id' => $address->country_id,
            'city_id' => $address->city_id,
            'area_id' => $address->area_id,
        ];

        foreach ($carts as $key => $cart) {
            $cart->shipping_type = 'home_delivery';
            $cart->pickup_point = 0;
            $cart->carrier_id = 0;
            $cart->shipping_cost = getShippingCost($carts, $key, $shippingInfo);
            $cart->save();
        }
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
}
