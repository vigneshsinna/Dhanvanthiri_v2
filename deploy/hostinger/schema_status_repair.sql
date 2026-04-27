-- Hostinger/phpMyAdmin repair for:
-- SQLSTATE[42S22]: Column not found: 1054 Unknown column 'status' in 'WHERE'
--
-- Run this in phpMyAdmin on the production database if you need an immediate
-- repair before running Laravel migrations. It only adds columns that are
-- missing, so it is safe to re-run.

DELIMITER $$

DROP PROCEDURE IF EXISTS add_status_column_if_missing $$
CREATE PROCEDURE add_status_column_if_missing(
    IN table_name_value VARCHAR(191),
    IN column_definition_value TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name_value
          AND COLUMN_NAME = 'status'
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', table_name_value, '` ADD COLUMN `status` ', column_definition_value);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

CALL add_status_column_if_missing('affiliate_logs', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('affiliate_options', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('affiliate_users', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('affiliate_withdraw_requests', 'VARCHAR(20) NOT NULL DEFAULT ''pending''') $$
CALL add_status_column_if_missing('areas', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('blogs', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('carriers', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('carts', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('cities', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('contacts', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('countries', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('coupons', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('currencies', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('custom_alerts', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('custom_sale_alerts', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('customer_products', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('dynamic_popups', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('elements', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('email_templates', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('faqs', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('flash_deals', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('guest_checkout_sessions', 'VARCHAR(191) NOT NULL DEFAULT ''active''') $$
CALL add_status_column_if_missing('languages', 'TINYINT(1) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('manual_payment_methods', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('notification_types', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('pages', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('payku_transactions', 'VARCHAR(191) NULL DEFAULT NULL') $$
CALL add_status_column_if_missing('payment_methods', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('preorders', 'VARCHAR(20) NOT NULL DEFAULT ''pending''') $$
CALL add_status_column_if_missing('proxy_payments', 'VARCHAR(20) NOT NULL DEFAULT ''pending''') $$
CALL add_status_column_if_missing('reviews', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('seller_withdraw_requests', 'VARCHAR(20) NOT NULL DEFAULT ''pending''') $$
CALL add_status_column_if_missing('shipping_systems', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('sms_templates', 'TINYINT(4) NOT NULL DEFAULT 0') $$
CALL add_status_column_if_missing('states', 'TINYINT(4) NOT NULL DEFAULT 1') $$
CALL add_status_column_if_missing('tickets', 'VARCHAR(20) NOT NULL DEFAULT ''pending''') $$
CALL add_status_column_if_missing('top_banners', 'TINYINT(4) NOT NULL DEFAULT 1') $$

DROP PROCEDURE IF EXISTS add_status_column_if_missing $$

DELIMITER ;

-- Extra repair for the payment settings page.
-- Some deployed databases had payment_methods.status but were still missing
-- the columns that the current Laravel controllers/views read.

SET @payment_active_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'active'
        ),
        'ALTER TABLE `payment_methods` ADD COLUMN `active` TINYINT(4) NOT NULL DEFAULT 0',
        'SELECT 1'
    )
);
PREPARE stmt FROM @payment_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `translations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lang` varchar(191) DEFAULT NULL,
  `lang_key` varchar(191) DEFAULT NULL,
  `lang_value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_translations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lang` varchar(191) DEFAULT NULL,
  `lang_key` varchar(191) DEFAULT NULL,
  `lang_value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @payment_addon_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'addon_identifier'
        ),
        'ALTER TABLE `payment_methods` ADD COLUMN `addon_identifier` VARCHAR(191) NULL DEFAULT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @payment_addon_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
