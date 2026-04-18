<?php

namespace App\Http\Controllers\Api\V2;

use App\Traits\ApiResponseTrait;

/**
 * Capability Flags Endpoint
 *
 * Returns runtime feature flags so the storefront can show/hide UI
 * without hardcoding backend knowledge. The storefront calls this once
 * on boot and caches the result.
 *
 * GET /api/v2/capabilities
 */
class CapabilityController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        return $this->successResponse([
            // ── Core features ───────────────────────────────────
            'multi_vendor'          => true,
            'guest_checkout'        => (bool) (get_setting('guest_checkout_activation') == 1),
            'wallet'                => (bool) (get_setting('wallet_system') == 1),
            'loyalty_points'        => (bool) addon_is_activated('club_point'),
            'email_verification'    => (bool) (get_setting('email_verification') == 1),

            // ── Addons ──────────────────────────────────────────
            'wishlist'              => true,
            'flash_deals'           => true,
            'coupons'               => true,
            'reviews'               => true,
            'refund_requests'       => (bool) addon_is_activated('refund_request'),
            'otp_system'            => (bool) addon_is_activated('otp_system'),
            'affiliate_system'      => (bool) addon_is_activated('affiliate_system'),
            'offline_payment'       => (bool) addon_is_activated('offline_payment'),
            'auction'               => (bool) addon_is_activated('auction'),
            'wholesale'             => (bool) addon_is_activated('wholesale'),
            'seller_subscription'   => (bool) addon_is_activated('seller_subscription'),
            'delivery_boy'          => (bool) addon_is_activated('delivery_boy'),
            'pos'                   => (bool) addon_is_activated('pos_system'),
            'blog'                  => true,

            // ── Checkout & Shipping ─────────────────────────────
            'minimum_order_check'   => (bool) (get_setting('minimum_order_amount_check') == 1),
            'minimum_order_amount'  => (float) (get_setting('minimum_order_amount') ?? 0),
            'pickup_point'          => (bool) (get_setting('pickup_point') == 1),
            'shipping_type'         => get_setting('shipping_type') ?? 'flat_rate',

            // ── Payment gateways (enabled/disabled) ─────────────
            'payment_methods'       => $this->getPaymentMethods(),

            // ── Localization ────────────────────────────────────
            'currency_symbol'       => currency_symbol(),
            'currency_code'         => \App\Models\Currency::find(get_setting('system_default_currency'))->code ?? 'USD',

            // ── Address fields ──────────────────────────────────
            'address_has_state'     => (bool) (get_setting('has_state') == 1),
        ], 'Capability flags retrieved');
    }

    protected function getPaymentMethods(): array
    {
        $methods = [];

        $gateways = [
            'paypal'       => 'paypal_payment',
            'stripe'       => 'stripe_payment',
            'sslcommerz'   => 'sslcommerz_payment',
            'instamojo'    => 'instamojo_payment',
            'razorpay'     => 'razorpay',
            'paystack'     => 'paystack',
            'bkash'        => 'bkash',
            'nagad'        => 'nagad',
            'iyzico'       => 'iyzico',
            'flutterwave'  => 'flutterwave',
            'paytm'        => 'paytm',
            'khalti'       => 'khalti_payment',
            'aamarpay'     => 'aamarpay',
            'mpesa'        => 'mpesa',
        ];

        foreach ($gateways as $key => $setting) {
            if (get_setting($setting) == 1) {
                $methods[] = $key;
            }
        }

        // Cash on Delivery
        if (get_setting('cash_payment') == 1) {
            $methods[] = 'cash_on_delivery';
        }

        // Wallet payment
        if (get_setting('wallet_system') == 1) {
            $methods[] = 'wallet';
        }

        return $methods;
    }
}
