<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use Illuminate\Support\Facades\Request;

function mock_my_asset($path) {
    $doc_root = $_SERVER['DOCUMENT_ROOT'] ?? 'NOT_SET';
    $base_public = base_path('public');
    
    echo "DOCUMENT_ROOT: " . $doc_root . "\n";
    echo "base_path('public'): " . $base_public . "\n";
    
    $prefix = $doc_root === $base_public ? '' : 'public/';
    echo "Prefix: " . $prefix . "\n";
    
    return asset($prefix . $path);
}

echo "Testing my_asset('uploads/all/test.png'):\n";
echo "Result: " . mock_my_asset('uploads/all/test.png') . "\n";
