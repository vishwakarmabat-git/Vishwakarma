-- Migration to add missing tables
-- Execute this in phpMyAdmin to add the remaining tables to vishwakarmabat

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Coupons
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_order_amount` DECIMAL(10,2) DEFAULT 0.00,
  `max_discount_amount` DECIMAL(10,2) DEFAULT NULL,
  `usage_limit` INT(11) DEFAULT NULL,
  `used_count` INT(11) DEFAULT 0,
  `valid_from` DATETIME DEFAULT NULL,
  `valid_until` DATETIME DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_coupon_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Newsletter Subscribers
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `status` ENUM('subscribed', 'unsubscribed') DEFAULT 'subscribed',
  `subscribed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_newsletter_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Persistent Cart
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) UNSIGNED NOT NULL,
  `product_id` BIGINT(20) UNSIGNED NOT NULL,
  `variant_id` BIGINT(20) UNSIGNED DEFAULT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cart_user_product` (`user_id`, `product_id`, `variant_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Activity Logs (Audit Trail)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) UNSIGNED DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
