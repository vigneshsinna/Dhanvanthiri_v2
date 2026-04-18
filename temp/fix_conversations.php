<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$kernel->handle($request = \Illuminate\Http\Request::capture());

// Fix conversations table
$cols = array_map(fn($c) => $c->Field, DB::select('SHOW COLUMNS FROM conversations'));
echo "conversations columns: " . implode(', ', $cols) . "\n";

$missing = [
    'receiver_viewed' => "TINYINT(1) NOT NULL DEFAULT 0",
    'sender_viewed' => "TINYINT(1) NOT NULL DEFAULT 0",
];

foreach ($missing as $col => $type) {
    if (!in_array($col, $cols)) {
        DB::statement("ALTER TABLE conversations ADD COLUMN $col $type");
        echo "Added: $col\n";
    }
}

echo "Done.\n";
