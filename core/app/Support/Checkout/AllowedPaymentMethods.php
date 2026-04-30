<?php

namespace App\Support\Checkout;

class AllowedPaymentMethods
{
    public const METHODS = ['razorpay', 'phonepe'];

    public const DISALLOWED = [
        'cod',
        'cash_on_delivery',
        'cash_payment',
        'cash',
        'offline_payment',
        'manual_payment',
        'wallet',
        'wallet_system',
    ];

    public static function normalize(?string $gateway): string
    {
        return strtolower(trim((string) $gateway));
    }

    public static function isAllowed(?string $gateway): bool
    {
        return in_array(self::normalize($gateway), self::METHODS, true);
    }
}
