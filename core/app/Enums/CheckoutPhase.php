<?php

namespace App\Enums;

/**
 * Checkout phase lifecycle for the headless storefront.
 *
 * The storefront navigates through these phases sequentially.
 * Each phase validates prerequisites before advancing.
 *
 * Flow: cart → address → shipping → payment → review → confirmed
 */
class CheckoutPhase
{
    public const CART      = 'cart';
    public const ADDRESS   = 'address';
    public const SHIPPING  = 'shipping';
    public const PAYMENT   = 'payment';
    public const REVIEW    = 'review';
    public const CONFIRMED = 'confirmed';

    /**
     * Ordered list of phases.
     */
    public static function sequence(): array
    {
        return [
            self::CART,
            self::ADDRESS,
            self::SHIPPING,
            self::PAYMENT,
            self::REVIEW,
            self::CONFIRMED,
        ];
    }

    /**
     * Check if a transition from one phase to another is valid.
     */
    public static function canAdvance(string $from, string $to): bool
    {
        $sequence = self::sequence();
        $fromIndex = array_search($from, $sequence);
        $toIndex = array_search($to, $sequence);

        if ($fromIndex === false || $toIndex === false) {
            return false;
        }

        // Can advance to next phase or go back to any previous phase
        return $toIndex <= $fromIndex + 1;
    }
}
