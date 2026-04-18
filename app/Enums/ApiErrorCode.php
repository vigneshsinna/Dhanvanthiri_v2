<?php

namespace App\Enums;

/**
 * Standardized error code registry for the headless commerce API contract.
 *
 * Machine-readable codes — storefronts use these to determine next actions
 * instead of parsing message strings.
 *
 * Categories:
 *   AUTH_*       — Identity & access
 *   VALIDATION_* — Input validation
 *   CATALOG_*    — Product/category/brand
 *   CART_*       — Shopping cart
 *   CHECKOUT_*   — Checkout flow
 *   PAYMENT_*    — Payment lifecycle
 *   ORDER_*      — Order management
 *   ACCOUNT_*    — Customer account
 *   RATE_*       — Rate / abuse limits
 *   INTERNAL_*   — System errors
 */
class ApiErrorCode
{
    // ── Authentication & Authorization ─────────────────────────
    public const UNAUTHORIZED           = 'UNAUTHORIZED';
    public const FORBIDDEN              = 'FORBIDDEN';
    public const AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS';
    public const AUTH_ACCOUNT_BANNED    = 'AUTH_ACCOUNT_BANNED';
    public const AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED';
    public const AUTH_TOKEN_EXPIRED     = 'AUTH_TOKEN_EXPIRED';
    public const AUTH_SOCIAL_LOGIN_FAILED = 'AUTH_SOCIAL_LOGIN_FAILED';

    // ── Validation ─────────────────────────────────────────────
    public const VALIDATION_ERROR       = 'VALIDATION_ERROR';

    // ── Catalog ────────────────────────────────────────────────
    public const PRODUCT_NOT_FOUND      = 'PRODUCT_NOT_FOUND';
    public const CATEGORY_NOT_FOUND     = 'CATEGORY_NOT_FOUND';
    public const BRAND_NOT_FOUND        = 'BRAND_NOT_FOUND';

    // ── Cart ───────────────────────────────────────────────────
    public const CART_EMPTY             = 'CART_EMPTY';
    public const CART_ITEM_NOT_FOUND    = 'CART_ITEM_NOT_FOUND';
    public const CART_OUT_OF_STOCK      = 'CART_OUT_OF_STOCK';
    public const CART_QUANTITY_EXCEEDED = 'CART_QUANTITY_EXCEEDED';
    public const CART_MIN_QUANTITY      = 'CART_MIN_QUANTITY';
    public const CART_AUCTION_CONFLICT  = 'CART_AUCTION_CONFLICT';
    public const CART_DIGITAL_DUPLICATE = 'CART_DIGITAL_DUPLICATE';

    // ── Coupon ─────────────────────────────────────────────────
    public const COUPON_NOT_FOUND       = 'COUPON_NOT_FOUND';
    public const COUPON_EXPIRED         = 'COUPON_EXPIRED';
    public const COUPON_NOT_APPLICABLE  = 'COUPON_NOT_APPLICABLE';
    public const COUPON_ALREADY_APPLIED = 'COUPON_ALREADY_APPLIED';
    public const COUPON_MIN_ORDER       = 'COUPON_MIN_ORDER';

    // ── Checkout ───────────────────────────────────────────────
    public const CHECKOUT_EXPIRED       = 'CHECKOUT_EXPIRED';
    public const CHECKOUT_INVALID_ADDRESS = 'CHECKOUT_INVALID_ADDRESS';
    public const CHECKOUT_SHIPPING_UNAVAILABLE = 'CHECKOUT_SHIPPING_UNAVAILABLE';
    public const CHECKOUT_VALIDATION_FAILED = 'CHECKOUT_VALIDATION_FAILED';

    // ── Payment ────────────────────────────────────────────────
    public const PAYMENT_FAILED         = 'PAYMENT_FAILED';
    public const PAYMENT_CANCELLED      = 'PAYMENT_CANCELLED';
    public const PAYMENT_GATEWAY_ERROR  = 'PAYMENT_GATEWAY_ERROR';
    public const PAYMENT_METHOD_UNAVAILABLE = 'PAYMENT_METHOD_UNAVAILABLE';
    public const PAYMENT_DUPLICATE      = 'PAYMENT_DUPLICATE';
    public const PAYMENT_AMOUNT_MISMATCH = 'PAYMENT_AMOUNT_MISMATCH';

    // ── Order ──────────────────────────────────────────────────
    public const ORDER_NOT_FOUND        = 'ORDER_NOT_FOUND';
    public const ORDER_CANCEL_NOT_ALLOWED = 'ORDER_CANCEL_NOT_ALLOWED';
    public const ORDER_ALREADY_CANCELLED = 'ORDER_ALREADY_CANCELLED';

    // ── Account ────────────────────────────────────────────────
    public const ACCOUNT_NOT_FOUND      = 'ACCOUNT_NOT_FOUND';
    public const ADDRESS_NOT_FOUND      = 'ADDRESS_NOT_FOUND';
    public const WISHLIST_ALREADY_EXISTS = 'WISHLIST_ALREADY_EXISTS';

    // ── System ─────────────────────────────────────────────────
    public const NOT_FOUND              = 'NOT_FOUND';
    public const RATE_LIMITED           = 'RATE_LIMITED';
    public const INTERNAL_ERROR         = 'INTERNAL_ERROR';

    /**
     * Return all error codes grouped by domain for documentation.
     */
    public static function registry(): array
    {
        return [
            'auth' => [
                self::UNAUTHORIZED,
                self::FORBIDDEN,
                self::AUTH_INVALID_CREDENTIALS,
                self::AUTH_ACCOUNT_BANNED,
                self::AUTH_EMAIL_NOT_VERIFIED,
                self::AUTH_TOKEN_EXPIRED,
                self::AUTH_SOCIAL_LOGIN_FAILED,
            ],
            'validation' => [
                self::VALIDATION_ERROR,
            ],
            'catalog' => [
                self::PRODUCT_NOT_FOUND,
                self::CATEGORY_NOT_FOUND,
                self::BRAND_NOT_FOUND,
            ],
            'cart' => [
                self::CART_EMPTY,
                self::CART_ITEM_NOT_FOUND,
                self::CART_OUT_OF_STOCK,
                self::CART_QUANTITY_EXCEEDED,
                self::CART_MIN_QUANTITY,
                self::CART_AUCTION_CONFLICT,
                self::CART_DIGITAL_DUPLICATE,
            ],
            'coupon' => [
                self::COUPON_NOT_FOUND,
                self::COUPON_EXPIRED,
                self::COUPON_NOT_APPLICABLE,
                self::COUPON_ALREADY_APPLIED,
                self::COUPON_MIN_ORDER,
            ],
            'checkout' => [
                self::CHECKOUT_EXPIRED,
                self::CHECKOUT_INVALID_ADDRESS,
                self::CHECKOUT_SHIPPING_UNAVAILABLE,
                self::CHECKOUT_VALIDATION_FAILED,
            ],
            'payment' => [
                self::PAYMENT_FAILED,
                self::PAYMENT_CANCELLED,
                self::PAYMENT_GATEWAY_ERROR,
                self::PAYMENT_METHOD_UNAVAILABLE,
                self::PAYMENT_DUPLICATE,
                self::PAYMENT_AMOUNT_MISMATCH,
            ],
            'order' => [
                self::ORDER_NOT_FOUND,
                self::ORDER_CANCEL_NOT_ALLOWED,
                self::ORDER_ALREADY_CANCELLED,
            ],
            'account' => [
                self::ACCOUNT_NOT_FOUND,
                self::ADDRESS_NOT_FOUND,
                self::WISHLIST_ALREADY_EXISTS,
            ],
            'system' => [
                self::NOT_FOUND,
                self::RATE_LIMITED,
                self::INTERNAL_ERROR,
            ],
        ];
    }
}
