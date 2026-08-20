SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
START TRANSACTION;
SET time_zone = '+00:00';

-- Clear existing mock data if any
DELETE FROM `product_images`;
DELETE FROM `products`;
DELETE FROM `categories`;

-- Insert Categories
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (1, 'single-blade', 'Single Blade', '/assets/poster.jpg', 1);
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (2, 'double-blade', 'Double Blade', '/assets/poster.jpg', 2);
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (3, 'triple-blade', 'Triple Blade', '/assets/poster.jpg', 3);
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (4, 'triple-blade-hard', 'Triple Blade Hard Pressed', '/assets/poster.jpg', 4);
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (5, 'triple-x2', 'Triple X2', '/assets/poster.jpg', 5);
INSERT INTO `categories` (`id`, `slug`, `name`, `banner_image`, `display_order`) VALUES (6, 'triple-x2-hard', 'Triple X2 Hard Pressed', '/assets/poster.jpg', 6);

-- Insert Products
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (1, 1, 'vk-1800', 'VK Platinum Single Blade', 'vk-1800', 1800, 12, 'Grade 3 Premium Kashmir Willow', 'Standard Pressed', '', 1, 1, 'VK Platinum Single Blade Cricket Bat | Vishwakarma Bat House', 'Shop handcrafted VK Platinum Single Blade cricket bat. Crafted with premium Kashmir willow and designed for power and balance.');
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (2, 2, 'vk-2100', 'VK Elite Double Blade', 'vk-2100', 2100, 12, 'Grade 2 Premium English Willow Style Kashmir Willow', 'Standard Pressed', '', 1, 1, 'VK Elite Double Blade Cricket Bat | Vishwakarma Bat House', 'Experience outstanding power with the VK Elite Double Blade cricket bat. Premium cane handle and perfect shock absorption.');
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (3, 3, 'vk-2400', 'VK Pro Triple Blade', 'vk-2400', 2400, 12, 'Grade 1 Selected Premium Willow', 'Standard Pressed', 'https://www.w3schools.com/html/mov_bbb.mp4', 0, 1, 'VK Pro Cricket Bat - Premium Handcrafted', 'Designed for tournament players, the VK Pro Triple Blade cricket bat delivers unmatched sweetspot response and power.');
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (4, 4, 'vk-2500', 'VK Gold Triple Blade Hard Pressed', 'vk-2500', 2500, 12, 'Grade 1 Special Select Willow', 'High Press (Hard Pressed)', '', 1, 1, 'VK Gold Triple Blade Hard Pressed Bat | Vishwakarma Bat House', 'Order the VK Gold Triple Blade Hard Pressed cricket bat. Extra pressed for instant playability and high durability.');
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (5, 5, 'vk-2800', 'VK Signature Triple X2', 'vk-2800', 2800, 12, 'Grade 1+ Tournament Grade Willow', 'Standard Pressed', '', 0, 1, 'VK Signature Triple X2 Cricket Bat | Handcrafted Power', 'Get the VK Signature Triple X2 bat with thick edges and light pickup. Ideal for heavy hitters looking for balance.');
INSERT INTO `products` (`id`, `category_id`, `sku`, `name`, `slug`, `price`, `gst_percentage`, `grade`, `pressing`, `video_url`, `is_featured`, `is_bestseller`, `seo_title`, `seo_description`) VALUES (6, 6, 'vk-3200', 'VK Limited Edition Triple X2 Hard Pressed', 'vk-3200', 3200, 12, 'Grade 1+ Super Select Professional Willow', 'High Press (Hard Pressed)', '', 1, 1, 'VK Limited Edition Triple X2 Hard Pressed Cricket Bat', 'Our flagship bat. Made from the finest select willow blocks, hard pressed for ultimate ping, power, and durability.');

-- Insert Product Images
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (1, '/assets/bat_single.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (1, '/assets/bat_double.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (1, '/assets/bat_back.png', 0, 2);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (2, '/assets/bat_double.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (2, '/assets/bat_single.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (2, '/assets/bat_back.png', 0, 2);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (3, '/assets/bat_single.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (3, '/assets/bat_back.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (3, '/assets/bat_double.png', 0, 2);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (4, '/assets/bat_double.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (4, '/assets/bat_back.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (5, '/assets/bat_single.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (5, '/assets/bat_double.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (6, '/assets/bat_single.png', 1, 0);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (6, '/assets/bat_double.png', 0, 1);
INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES (6, '/assets/bat_back.png', 0, 2);

COMMIT;
