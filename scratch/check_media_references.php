<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use App\Models\Category;
use App\Models\Brand;
use App\Models\Upload;

echo "--- CATEGORIES ---\n";
$categories = Category::whereNotNull('cover_image')->limit(5)->get();
foreach ($categories as $c) {
    echo "Category: " . $c->name . " | Cover Image ID/Path: " . $c->cover_image . "\n";
    if (is_numeric($c->cover_image)) {
        $upload = Upload::find($c->cover_image);
        if ($upload) {
            echo "  -> File: " . $upload->file_name . "." . $upload->extension . "\n";
        } else {
            echo "  -> Upload record NOT FOUND\n";
        }
    }
}

echo "\n--- BRANDS ---\n";
$brands = Brand::whereNotNull('logo')->limit(5)->get();
foreach ($brands as $b) {
    echo "Brand: " . $b->name . " | Logo ID/Path: " . $b->logo . "\n";
    if (is_numeric($b->logo)) {
        $upload = Upload::find($b->logo);
        if ($upload) {
            echo "  -> File: " . $upload->file_name . "." . $upload->extension . "\n";
        } else {
            echo "  -> Upload record NOT FOUND\n";
        }
    }
}
