<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use App\Models\Upload;

$uploads = Upload::latest()->limit(10)->get();

echo "ID | File Name | Extension | External Link\n";
echo "---|-----------|-----------|--------------\n";
foreach ($uploads as $u) {
    echo $u->id . " | " . $u->file_name . " | " . $u->extension . " | " . ($u->external_link ?: 'NULL') . "\n";
}
