<?php

namespace App\Observers;

use App\Models\BusinessSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class BusinessSettingObserver
{
    public function saved(BusinessSetting $businessSetting)
    {
        $this->clearCache();
    }

    public function deleted(BusinessSetting $businessSetting)
    {
        $this->clearCache();
    }

    protected function clearCache()
    {
        Artisan::call('cache:clear');
    }
}
