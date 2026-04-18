<?php
$db = new PDO('sqlite:database/database.sqlite');
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
echo "Tables found: " . count($tables) . PHP_EOL;
foreach ($tables as $table) {
    echo "- $table" . PHP_EOL;
}
