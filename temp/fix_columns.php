<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=animazon', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fix languages table - add status column if missing
$cols = [];
$stmt = $pdo->query('DESCRIBE languages');
foreach ($stmt as $row) $cols[] = $row['Field'];

echo "Languages columns: " . implode(', ', $cols) . "\n";

if (!in_array('status', $cols)) {
    $pdo->exec("ALTER TABLE `languages` ADD `status` tinyint(1) NOT NULL DEFAULT 1");
    echo "Added: languages.status\n";
}
if (!in_array('app_lang_code', $cols)) {
    $pdo->exec("ALTER TABLE `languages` ADD `app_lang_code` varchar(100) DEFAULT NULL");
    echo "Added: languages.app_lang_code\n";
}

// Update existing English language record to have status=1
$pdo->exec("UPDATE `languages` SET `status` = 1 WHERE `code` = 'en'");
echo "Updated English language status to 1\n";

// Check users table for banned column
$cols = [];
$stmt = $pdo->query('DESCRIBE users');
foreach ($stmt as $row) $cols[] = $row['Field'];
echo "Users columns: " . implode(', ', $cols) . "\n";

if (!in_array('banned', $cols)) {
    $pdo->exec("ALTER TABLE `users` ADD `banned` tinyint(1) NOT NULL DEFAULT 0");
    echo "Added: users.banned\n";
}

echo "Done.\n";
