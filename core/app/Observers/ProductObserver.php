<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    public function saved(Product $product)
    {
        $this->clearCache($product);
    }

    public function deleted(Product $product)
    {
        $this->clearCache($product);
    }

    protected function clearCache(Product $product)
    {
        Cache::forget('app.flash_deals');
        if ($product->user_id) {
            Cache::forget("app.top_selling_products-{$product->user_id}");
            Cache::forget("app.featured_products-{$product->user_id}");
            Cache::forget("app.new_products-{$product->user_id}");
        }
    }
}
