<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=animazon', 'root', '');

// Add missing business settings
$settings = [
    'authentication_layout_select' => 'free',
    'admin_login_page_image' => null,
];

foreach ($settings as $type => $value) {
    $stmt = $pdo->prepare("SELECT id FROM business_settings WHERE type = ?");
    $stmt->execute([$type]);
    if (!$stmt->fetch()) {
        $stmt2 = $pdo->prepare("INSERT INTO business_settings (type, value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
        $stmt2->execute([$type, $value]);
        echo "Added: $type = $value\n";
    } else {
        echo "Already exists: $type\n";
    }
}

echo "Done.\n";
