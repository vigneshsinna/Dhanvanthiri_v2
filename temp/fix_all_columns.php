<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=animazon', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

function tableExists($pdo, $table) {
    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
    return $stmt->rowCount() > 0;
}

function getColumns($pdo, $table) {
    $cols = [];
    $stmt = $pdo->query("DESCRIBE `$table`");
    foreach ($stmt as $row) $cols[] = $row['Field'];
    return $cols;
}

function addColumnIfMissing($pdo, $table, $column, $definition) {
    $cols = getColumns($pdo, $table);
    if (!in_array($column, $cols)) {
        $pdo->exec("ALTER TABLE `$table` ADD `$column` $definition");
        echo "  Added: $table.$column\n";
        return true;
    }
    return false;
}

// ===== Check all critical tables =====
$tables = ['categories', 'products', 'product_stocks', 'orders', 'order_details', 'users', 'brands', 'shops', 'languages', 'currencies', 'business_settings', 'uploads', 'permissions', 'roles', 'model_has_roles', 'model_has_permissions', 'role_has_permissions'];

echo "=== Table Check ===\n";
foreach ($tables as $t) {
    echo ($tableExists = tableExists($pdo, $t)) ? "  OK: $t\n" : "  MISSING: $t\n";
}

// ===== Fix products table =====
echo "\n=== Products Table ===\n";
$needed = [
    'num_of_sale' => 'int(11) NOT NULL DEFAULT 0',
    'approved' => 'tinyint(1) NOT NULL DEFAULT 1',
    'published' => 'tinyint(1) NOT NULL DEFAULT 1',
    'added_by' => "varchar(50) NOT NULL DEFAULT 'admin'",
    'category_id' => 'bigint(20) unsigned DEFAULT NULL',
    'brand_id' => 'bigint(20) unsigned DEFAULT NULL',
    'user_id' => 'bigint(20) unsigned DEFAULT NULL',
    'rating' => 'double(8,2) NOT NULL DEFAULT 0.00',
    'slug' => 'varchar(500) DEFAULT NULL',
    'name' => 'varchar(500) DEFAULT NULL',
    'unit_price' => 'double(20,2) NOT NULL DEFAULT 0.00',
    'purchase_price' => 'double(20,2) NOT NULL DEFAULT 0.00',
    'min_qty' => 'int(11) NOT NULL DEFAULT 1',
    'thumbnail_img' => 'varchar(255) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'products', $col, $def);
}

// ===== Fix product_stocks table =====
echo "\n=== Product Stocks Table ===\n";
$needed = [
    'product_id' => 'bigint(20) unsigned DEFAULT NULL',
    'qty' => 'int(11) NOT NULL DEFAULT 0',
    'price' => 'double(20,2) NOT NULL DEFAULT 0.00',
    'variant' => 'varchar(255) DEFAULT NULL',
    'sku' => 'varchar(255) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'product_stocks', $col, $def);
}

// ===== Fix orders table =====
echo "\n=== Orders Table ===\n";
$needed = [
    'user_id' => 'bigint(20) unsigned DEFAULT NULL',
    'seller_id' => 'bigint(20) unsigned DEFAULT NULL',
    'grand_total' => 'double(20,2) NOT NULL DEFAULT 0.00',
    'delivery_status' => "varchar(50) NOT NULL DEFAULT 'pending'",
    'payment_type' => 'varchar(50) DEFAULT NULL',
    'payment_status' => "varchar(50) NOT NULL DEFAULT 'unpaid'",
    'code' => 'varchar(100) DEFAULT NULL',
    'date' => 'int(11) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'orders', $col, $def);
}

// ===== Fix order_details table =====
echo "\n=== Order Details Table ===\n";
$needed = [
    'order_id' => 'bigint(20) unsigned DEFAULT NULL',
    'product_id' => 'bigint(20) unsigned DEFAULT NULL',
    'seller_id' => 'bigint(20) unsigned DEFAULT NULL',
    'price' => 'double(20,2) NOT NULL DEFAULT 0.00',
    'quantity' => 'int(11) NOT NULL DEFAULT 0',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'order_details', $col, $def);
}

// ===== Fix users table =====
echo "\n=== Users Table ===\n";
$needed = [
    'user_type' => "varchar(50) NOT NULL DEFAULT 'customer'",
    'banned' => 'tinyint(1) NOT NULL DEFAULT 0',
    'email_verified_at' => 'timestamp NULL DEFAULT NULL',
    'avatar' => 'varchar(255) DEFAULT NULL',
    'avatar_original' => 'varchar(255) DEFAULT NULL',
    'balance' => 'double(20,2) NOT NULL DEFAULT 0.00',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'users', $col, $def);
}

// ===== Fix shops table =====
echo "\n=== Shops Table ===\n";
$needed = [
    'user_id' => 'bigint(20) unsigned DEFAULT NULL',
    'verification_status' => 'tinyint(1) NOT NULL DEFAULT 0',
    'name' => 'varchar(255) DEFAULT NULL',
    'slug' => 'varchar(255) DEFAULT NULL',
    'logo' => 'varchar(255) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'shops', $col, $def);
}

// ===== Fix brands table =====
echo "\n=== Brands Table ===\n";
$needed = [
    'name' => 'varchar(255) DEFAULT NULL',
    'slug' => 'varchar(255) DEFAULT NULL',
    'logo' => 'varchar(255) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'brands', $col, $def);
}

// ===== Fix categories table =====
echo "\n=== Categories Table ===\n";
$needed = [
    'level' => 'int(11) NOT NULL DEFAULT 0',
    'parent_id' => 'bigint(20) unsigned DEFAULT NULL',
    'name' => 'varchar(255) DEFAULT NULL',
    'slug' => 'varchar(255) DEFAULT NULL',
    'icon' => 'varchar(255) DEFAULT NULL',
    'banner' => 'varchar(255) DEFAULT NULL',
    'order_level' => 'int(11) NOT NULL DEFAULT 0',
    'commision_rate' => 'double(8,2) NOT NULL DEFAULT 0.00',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'categories', $col, $def);
}

// ===== Fix languages table =====
echo "\n=== Languages Table ===\n";
$needed = [
    'status' => 'tinyint(1) NOT NULL DEFAULT 1',
    'app_lang_code' => 'varchar(100) DEFAULT NULL',
];
foreach ($needed as $col => $def) {
    addColumnIfMissing($pdo, 'languages', $col, $def);
}

// ===== Check uploads table =====
echo "\n=== Uploads Table ===\n";
if (tableExists($pdo, 'uploads')) {
    $needed = [
        'file_original_name' => 'varchar(500) DEFAULT NULL',
        'file_name' => 'varchar(500) DEFAULT NULL',
        'extension' => 'varchar(50) DEFAULT NULL',
        'type' => 'varchar(50) DEFAULT NULL',
        'file_size' => 'int(11) DEFAULT NULL',
        'user_id' => 'bigint(20) unsigned DEFAULT NULL',
    ];
    foreach ($needed as $col => $def) {
        addColumnIfMissing($pdo, 'uploads', $col, $def);
    }
}

echo "\nAll checks and fixes complete.\n";
