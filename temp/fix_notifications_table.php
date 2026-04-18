<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$kernel->handle($request = \Illuminate\Http\Request::capture());

// Create notifications table (Laravel default)
if (!Schema::hasTable('notifications')) {
    Schema::create('notifications', function ($table) {
        $table->uuid('id')->primary();
        $table->string('type');
        $table->morphs('notifiable');
        $table->text('data');
        $table->timestamp('read_at')->nullable();
        $table->timestamps();
    });
    echo "Created notifications table\n";
} else {
    echo "notifications table already exists\n";
}

echo "Done.\n";
