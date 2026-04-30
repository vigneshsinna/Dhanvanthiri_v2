<?php

namespace App\Exceptions;

use Exception;
use App\Enums\ApiErrorCode;

/**
 * Thrown when a headless-API business rule is violated.
 *
 * Usage:
 *   throw new ApiBusinessException(ApiErrorCode::CART_OUT_OF_STOCK, 'Item is out of stock');
 *   throw new ApiBusinessException(ApiErrorCode::COUPON_EXPIRED, 'Coupon has expired', ['coupon_code' => 'SUMMER23'], 409);
 */
class ApiBusinessException extends Exception
{
    protected string $errorCode;
    protected array $details;
    protected int $statusCode;

    public function __construct(string $errorCode, string $message, array $details = [], int $statusCode = 409)
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->details = $details;
        $this->statusCode = $statusCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function render($request)
    {
        $error = ['code' => $this->errorCode];

        if (!empty($this->details)) {
            $error['details'] = $this->details;
        }

        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error'   => $error,
        ], $this->statusCode);
    }
}
