<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Resources\V2\WishlistCollection;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;

use App\Traits\ApiResponseTrait;

class WishlistController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        return new WishlistCollection(get_wishlists()->get());
    }

    public function add($slug)
    {
        // Accept both slug and numeric product ID
        $product = is_numeric($slug)
            ? Product::find((int) $slug)
            : Product::where('slug', $slug)->first();

        if (!$product) {
            return $this->failedResponse(null, translate('Product not found'), 404);
        }

        $wishlist = Wishlist::where('product_id', $product->id)->where('user_id', auth()->user()->id)->first();
        if ($wishlist != null) {
            return $this->successResponse([
                'is_in_wishlist' => true,
                'product_id' => (integer)$product->id,
                'product_slug' => $product->slug,
                'wishlist_id' => $wishlist->id
            ], translate('Product present in wishlist'));
        } else {
            $wishlist = Wishlist::create(
                ['user_id' =>auth()->user()->id, 'product_id' =>$product->id]
            );

            return $this->successResponse([
                'is_in_wishlist' => true,
               'product_id' => (integer)$product->id,
                'product_slug' => $product->slug,
                'wishlist_id' => $wishlist->id
            ], translate('Product added to wishlist'));
        }
    }

    public function remove($slug)
    {
        $product = Product::where('slug', $slug)->first();
        if (!$product) {
            return $this->failedResponse(null, translate('Product not found'), 404);
        }
        $wishlist = Wishlist::where('product_id', $product->id)->where('user_id',  auth()->user()->id)->first();
        if ($wishlist == null) {
            return $this->successResponse([
                'is_in_wishlist' => false,
                'product_id' => (integer)$product->id,
                'product_slug' => $product->slug
            ], translate('Product is not in wishlist'));
        } else {
            Wishlist::where('product_id' , $product->id)->where( 'user_id' , auth()->user()->id)->delete();
            return $this->successResponse([
                'is_in_wishlist' => false,
                'product_id' => (integer)$product->id,
                'product_slug' => $product->slug
            ], translate('Product is removed from wishlist'));
        }
    }

    public function isProductInWishlist($slug)
    {
        $product = Product::where('slug', $slug)->first();
        if (!$product) {
            return $this->failedResponse(null, translate('Product not found'), 404);
        }

        $wishlist = Wishlist::where('product_id', $product->id)->where('user_id',  auth()->user()->id)->first();

        if ($wishlist != null) {
            return $this->successResponse([
                'is_in_wishlist' => true,
                'product_id' => (integer)$product->id,
                'wishlist_id' => $wishlist->id
            ], translate('Product present in wishlist'));
        }else{
            return $this->successResponse([
                'is_in_wishlist' => false,
                'product_id' => (integer)$product->id,
                'wishlist_id' => null
            ], translate('Product is not present in wishlist'));
        }
       
    }
}