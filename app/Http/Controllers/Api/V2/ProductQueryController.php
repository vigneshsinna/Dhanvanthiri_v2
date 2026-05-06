<?php

namespace App\Http\Controllers\Api\V2;

use App\Mail\ContactMailManager;
use App\Models\Product;
use App\Models\ProductQuery;
use App\Support\BusinessContact;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ProductQueryController extends Controller
{
    use ApiResponseTrait;

    public function index(int $id): JsonResponse
    {
        $queries = ProductQuery::with('user:id,name')
            ->where('product_id', $id)
            ->latest()
            ->get()
            ->map(function (ProductQuery $query) {
                return [
                    'id' => (int) $query->id,
                    'product_id' => (int) $query->product_id,
                    'customer_id' => (int) $query->customer_id,
                    'customer_name' => optional($query->user)->name,
                    'question' => (string) $query->question,
                    'reply' => $query->reply,
                    'created_at' => optional($query->created_at)?->toISOString(),
                ];
            })
            ->values();

        return $this->collectionResponse($queries);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'product_id' => ['sometimes', 'integer'],
            'product' => ['sometimes', 'integer'],
            'question' => ['required', 'string'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
        ]);

        $productId = (int) ($payload['product_id'] ?? $payload['product'] ?? 0);
        $product = Product::find($productId);

        if (!$product) {
            return $this->notFoundResponse('Product not found');
        }

        $query = new ProductQuery();
        $query->customer_id = (int) auth()->id();
        $query->seller_id = (int) $product->user_id;
        $query->product_id = (int) $product->id;
        $query->question = (string) $payload['question'];
        $query->save();

        $recipientEmail = BusinessContact::email();
        if ($recipientEmail) {
            $customer = auth()->user();
            $customerEmail = $customer?->email ?: ($payload['customer_email'] ?? '');
            $customerName = $customer?->name ?: ($payload['customer_name'] ?? 'Storefront customer');

            try {
                Mail::to($recipientEmail)->queue(new ContactMailManager([
                    'name' => $customerName,
                    'email' => $customerEmail,
                    'phone' => '',
                    'content' => 'Product: ' . e($product->name) . '<br>Question: ' . e((string) $payload['question']),
                    'subject' => 'Product question: ' . $product->name,
                    'from' => $customerEmail ?: env('MAIL_FROM_ADDRESS'),
                ]));
            } catch (\Throwable $exception) {
            }
        }

        return $this->createdResponse([
            'id' => (int) $query->id,
            'product_id' => (int) $query->product_id,
            'question' => (string) $query->question,
        ], 'Product query submitted');
    }
}
