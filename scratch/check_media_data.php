<?php

use App\Models\Product;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$product = DB::table('products')->where('id', 1)->first();

if ($product) {
    echo "Product ID 1 raw data:\n";
    echo "thumbnail_img: " . var_export($product->thumbnail_img, true) . "\n";
    echo "photos: " . var_export($product->photos, true) . "\n";
    
    $p = Product::find(1);
    echo "\nProduct ID 1 model data:\n";
    echo "thumbnail_img accessor: " . var_export($p->thumbnail_img, true) . "\n";
    echo "photos accessor: " . var_export($p->photos, true) . "\n";
} else {
    echo "Product ID 1 not found.\n";
}
