<?php

namespace App\Exceptions;

use App\Enums\ApiErrorCode;
use App\Utility\NgeniusUtility;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        ApiBusinessException::class,
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        // ── Standardized JSON responses for API requests ──────────────
        if ($request->is('api/*') || $request->wantsJson()) {
            return $this->renderApiException($request, $e);
        }

        // ── Legacy web rendering (unchanged) ─────────────────────────
        if ($e instanceof Redirectingexception) {
            return redirect()->back();
        }

        if ($this->isHttpException($e)) {
            if ($request->is('customer-products/admin')) {
                return NgeniusUtility::initPayment();
            }

            return parent::render($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Render a standardized JSON error envelope for API requests.
     */
    protected function renderApiException($request, Throwable $e)
    {
        // ApiBusinessException renders itself via render() method
        if ($e instanceof ApiBusinessException) {
            return $e->render($request);
        }

        // Validation errors → 422 with field details
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'error'   => [
                    'code'   => ApiErrorCode::VALIDATION_ERROR,
                    'fields' => $e->errors(),
                ],
            ], 422);
        }

        // Authentication errors → 401
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'error'   => [
                    'code' => ApiErrorCode::UNAUTHORIZED,
                ],
            ], 401);
        }

        // Model not found → 404
        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());
            return response()->json([
                'success' => false,
                'message' => "{$model} not found",
                'error'   => [
                    'code' => ApiErrorCode::NOT_FOUND,
                ],
            ], 404);
        }

        // Route / URL not found → 404
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint not found',
                'error'   => [
                    'code' => ApiErrorCode::NOT_FOUND,
                ],
            ], 404);
        }

        // Rate limiting → 429
        if ($e instanceof ThrottleRequestsException) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests',
                'error'   => [
                    'code' => ApiErrorCode::RATE_LIMITED,
                ],
            ], 429);
        }

        // All other exceptions → 500 (hide details in production)
        $message = config('app.debug') ? $e->getMessage() : 'Internal server error';

        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => ApiErrorCode::INTERNAL_ERROR,
            ],
        ], 500);
    }
}