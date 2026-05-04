<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$sqlFile = 'v:\pers\Freelance\Dhanvathiri_v2\all_combined_updates.sql';
if (!file_exists($sqlFile)) {
    die("SQL file not found: $sqlFile\n");
}

echo "Loading SQL content...\n";
$sql = file_get_contents($sqlFile);

// The file is large, so we should split it into individual queries
// Note: This is a simplified splitter, it won't handle complex triggers/procedures well
// but should be fine for standard inserts/updates/alters.
$queries = explode(";\n", $sql);

echo "Executing " . count($queries) . " queries...\n";

$count = 0;
$errors = 0;
foreach ($queries as $query) {
    $query = trim($query);
    if (!empty($query)) {
        try {
            DB::unprepared($query);
            $count++;
        } catch (\Exception $e) {
            $errors++;
            if ($errors < 10) {
                echo "Error in query: " . substr($query, 0, 100) . "...\n";
                echo "Message: " . $e->getMessage() . "\n";
            }
        }
        if ($count % 100 == 0) echo "Processed $count queries...\n";
    }
}
echo "Successfully executed $count queries.\n";
echo "Total Errors: $errors\n";
