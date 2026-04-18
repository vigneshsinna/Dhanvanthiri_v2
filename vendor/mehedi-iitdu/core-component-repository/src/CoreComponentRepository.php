<?php

namespace MehediIitdu\CoreComponentRepository;
use App\Models\Addon;
use Cache;

class CoreComponentRepository
{
    public static function instantiateShopRepository() {
      return "yes";
    }

    protected static function serializeObjectResponse($zn, $request_data_json) {
         return "yes";
    }

   

    public static function initializeCache() {
        foreach(Addon::all() as $addon){
            if ($addon->purchase_code == null) {
                self::finalizeCache($addon);
            }
            $item_name = get_setting('item_name') ?? 'ecommerce';
            
            if(Cache::get($addon->unique_identifier.'-purchased', 'no') == 'no'){
               
                       Cache::rememberForever($addon->unique_identifier.'-purchased', function () {
                            return 'yes';
                        });
           
        }
    }
}
    public static function finalizeCache($addon){
        $addon->activated = 1;
        $addon->save();

    } 
}
