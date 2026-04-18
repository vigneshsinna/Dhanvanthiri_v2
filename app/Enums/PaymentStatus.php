<?php

namespace App\Enums;

/**
 * Payment lifecycle states for the headless checkout contract.
 *
 * State transitions:
 *   pending → requires_action → authorized → paid
 *   pending → failed
 *   pending → cancelled
 *   pending → expired
 *   paid → refunded (partial or full)
 */
class PaymentStatus
{
    public const PENDING          = 'pending';
    public const REQUIRES_ACTION  = 'requires_action';  // 3DS, redirect, OTP
    public const AUTHORIZED       = 'authorized';       // Funds held
    public const PAID             = 'paid';
    public const FAILED           = 'failed';
    public const CANCELLED        = 'cancelled';
    public const EXPIRED          = 'expired';
    public const REFUNDED         = 'refunded';
    public const PARTIALLY_REFUNDED = 'partially_refunded';

    public static function all(): array
    {
        return [
            self::PENDING,
            self::REQUIRES_ACTION,
            self::AUTHORIZED,
            self::PAID,
            self::FAILED,
            self::CANCELLED,
            self::EXPIRED,
            self::REFUNDED,
            self::PARTIALLY_REFUNDED,
        ];
    }

    /**
     * Valid transitions from a given state.
     */
    public static function allowedTransitions(string $from): array
    {
        return match ($from) {
            self::PENDING         => [self::REQUIRES_ACTION, self::AUTHORIZED, self::PAID, self::FAILED, self::CANCELLED, self::EXPIRED],
            self::REQUIRES_ACTION => [self::AUTHORIZED, self::PAID, self::FAILED, self::CANCELLED, self::EXPIRED],
            self::AUTHORIZED      => [self::PAID, self::FAILED, self::CANCELLED],
            self::PAID            => [self::REFUNDED, self::PARTIALLY_REFUNDED],
            default               => [],
        };
    }
}
