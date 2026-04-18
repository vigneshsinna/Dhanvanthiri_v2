<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=animazon', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Create permissions table
if (!tableExists($pdo, 'permissions')) {
    $pdo->exec("CREATE TABLE `permissions` (
        `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `guard_name` varchar(255) NOT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Created: permissions\n";
}

// Create roles table
if (!tableExists($pdo, 'roles')) {
    $pdo->exec("CREATE TABLE `roles` (
        `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `guard_name` varchar(255) NOT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Created: roles\n";
}

// Create model_has_permissions table
if (!tableExists($pdo, 'model_has_permissions')) {
    $pdo->exec("CREATE TABLE `model_has_permissions` (
        `permission_id` bigint(20) unsigned NOT NULL,
        `model_type` varchar(255) NOT NULL,
        `model_id` bigint(20) unsigned NOT NULL,
        KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
        PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
        CONSTRAINT `mhp_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Created: model_has_permissions\n";
}

// Create model_has_roles table
if (!tableExists($pdo, 'model_has_roles')) {
    $pdo->exec("CREATE TABLE `model_has_roles` (
        `role_id` bigint(20) unsigned NOT NULL,
        `model_type` varchar(255) NOT NULL,
        `model_id` bigint(20) unsigned NOT NULL,
        KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
        PRIMARY KEY (`role_id`,`model_id`,`model_type`),
        CONSTRAINT `mhr_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Created: model_has_roles\n";
}

// Create role_has_permissions table
if (!tableExists($pdo, 'role_has_permissions')) {
    $pdo->exec("CREATE TABLE `role_has_permissions` (
        `permission_id` bigint(20) unsigned NOT NULL,
        `role_id` bigint(20) unsigned NOT NULL,
        PRIMARY KEY (`permission_id`,`role_id`),
        CONSTRAINT `rhp_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
        CONSTRAINT `rhp_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Created: role_has_permissions\n";
}

echo "All Spatie permission tables created.\n";

function tableExists($pdo, $table) {
    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
    return $stmt->rowCount() > 0;
}
