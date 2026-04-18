<?php

namespace App\Observers;

use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryObserver
{
    public function saved(Category $category)
    {
        $this->clearCache();
    }

    public function deleted(Category $category)
    {
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('app.filter_categories');
        Cache::forget('app.featured_categories');
        Cache::forget('app.home_categories');
        Cache::forget('app.top_categories');
    }
}
