<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Admin\Concerns\AdminAuth;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReviewController extends Controller
{
    use AdminAuth;

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $perPage = $this->clampPerPage($request);
        $status = $request->input('status');
        $productId = $request->input('product_id');

        $query = Review::with(['product', 'user'])->latest('id');

        if ($status === 'published') {
            $query->where('status', 1);
        } elseif ($status === 'pending') {
            $query->where('status', 0);
        }

        if ($productId) {
            $query->where('product_id', (int) $productId);
        }

        $reviews = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $reviews->getCollection()->map(fn(Review $r) => $this->serialize($r))->values(),
                'meta' => $this->paginationMeta($reviews),
            ],
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate(['status' => ['required', 'string', 'in:published,pending,rejected']]);

        $review = Review::findOrFail($id);
        $review->status = $payload['status'] === 'published' ? 1 : 0;
        $review->save();

        return response()->json(['success' => true, 'message' => 'Review status updated']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);
        Review::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Review deleted']);
    }

    public function createCustom(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'custom_reviewer_name' => ['required', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        $review = new Review();
        $review->product_id = $payload['product_id'];
        $review->user_id = $request->user()->id;
        $review->rating = $payload['rating'];
        $review->comment = ($payload['title'] ? $payload['title'] . "\n" : '') . $payload['body'];
        $review->status = 1;
        $review->save();

        return response()->json(['success' => true, 'message' => 'Custom review created', 'data' => $this->serialize($review->fresh(['product', 'user']))]);
    }

    public function statistics(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'total' => Review::count(),
                'published' => Review::where('status', 1)->count(),
                'pending' => Review::where('status', 0)->count(),
                'average_rating' => round((float) Review::where('status', 1)->avg('rating'), 2),
                'rating_distribution' => [
                    5 => Review::where('rating', 5)->where('status', 1)->count(),
                    4 => Review::where('rating', 4)->where('status', 1)->count(),
                    3 => Review::where('rating', 3)->where('status', 1)->count(),
                    2 => Review::where('rating', 2)->where('status', 1)->count(),
                    1 => Review::where('rating', 1)->where('status', 1)->count(),
                ],
            ],
        ]);
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'status' => ['required', 'string', 'in:published,pending,rejected'],
        ]);

        $newStatus = $payload['status'] === 'published' ? 1 : 0;
        Review::whereIn('id', $payload['ids'])->update(['status' => $newStatus]);

        return response()->json(['success' => true, 'message' => 'Reviews updated']);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $ids = $request->validate(['ids' => ['required', 'array']])['ids'];
        Review::whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => 'Reviews deleted']);
    }

    public function export(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $reviews = Review::with(['product', 'user'])->latest('id')->limit(5000)->get();

        $rows = $reviews->map(fn(Review $r) => [
            'id' => $r->id,
            'product' => $r->product?->name,
            'user' => $r->user?->name,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'status' => $r->status ? 'published' : 'pending',
            'created_at' => optional($r->created_at)->toDateTimeString(),
        ]);

        return response()->json(['success' => true, 'data' => ['rows' => $rows, 'count' => $rows->count()]]);
    }

    private function serialize(Review $r): array
    {
        return [
            'id' => $r->id,
            'product_id' => $r->product_id,
            'product_name' => $r->product?->name,
            'user_id' => $r->user_id,
            'user_name' => $r->user?->name ?? 'Guest',
            'rating' => (int) $r->rating,
            'comment' => $r->comment,
            'status' => $r->status ? 'published' : 'pending',
            'created_at' => optional($r->created_at)->toISOString(),
        ];
    }
}
