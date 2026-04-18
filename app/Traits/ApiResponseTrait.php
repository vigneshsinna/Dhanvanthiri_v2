<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Standardized API response envelope for the headless commerce contract.
 *
 * Provides a single, consistent JSON envelope pattern across ALL API endpoints.
 * This replaces the legacy mixed patterns ({result, message}, {success, status, data}, custom shapes).
 *
 * Standard envelope:
 * {
 *   "success": bool,
 *   "message": "human-readable message",
 *   "data":    object|array|null,
 *   "meta":    { pagination, filters, etc. } | null,
 *   "error":   { code, fields, details } | null
 * }
 */
trait ApiResponseTrait
{
    /**
     * Success response — single resource.
     */
    protected function successResponse($data = null, string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Success response — collection with optional pagination meta.
     */
    protected function collectionResponse($data, array $meta = [], string $message = 'Success', int $status = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ];

        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Success response — paginated collection from an Eloquent paginator.
     */
    protected function paginatedResponse($paginator, $transformer = null, string $message = 'Success'): JsonResponse
    {
        $items = $paginator->getCollection();

        if ($transformer !== null) {
            $items = $items->map($transformer);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $items,
            'meta'    => [
                'page'     => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total'    => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ], 200);
    }

    /**
     * Success response — action completed (e.g. "item added to cart").
     */
    protected function actionResponse($data = null, string $message = 'Action completed', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Created response (HTTP 201).
     */
    protected function createdResponse($data = null, string $message = 'Created'): JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    /**
     * Error response — validation failure.
     */
    protected function validationErrorResponse(array $fields, string $message = 'Validation failed'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code'   => 'VALIDATION_ERROR',
                'fields' => $fields,
            ],
        ], 422);
    }

    /**
     * Error response — business rule violation.
     */
    protected function businessErrorResponse(string $code, string $message, array $details = [], int $status = 409): JsonResponse
    {
        $error = [
            'code' => $code,
        ];

        if (!empty($details)) {
            $error['details'] = $details;
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => $error,
        ], $status);
    }

    /**
     * Error response — not found.
     */
    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => 'NOT_FOUND',
            ],
        ], 404);
    }

    /**
     * Error response — unauthorized.
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => 'UNAUTHORIZED',
            ],
        ], 401);
    }

    /**
     * Error response — forbidden.
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => 'FORBIDDEN',
            ],
        ], 403);
    }

    /**
     * Error response — generic server error.
     */
    protected function serverErrorResponse(string $message = 'Internal server error'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => 'INTERNAL_ERROR',
            ],
        ], 500);
    }

    /**
     * Error response — rate limited.
     */
    protected function rateLimitedResponse(string $message = 'Too many requests'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error'   => [
                'code' => 'RATE_LIMITED',
            ],
        ], 429);
    }
}
