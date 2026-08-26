-- ==========================================================
-- Database Schema for Brief & Admin Management System
-- Compatible with MySQL 5.7+ / 8.0+ (WAMP Server & Byethost)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `brief_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `brief_db`;

-- 1. Table for brief submissions
CREATE TABLE IF NOT EXISTS `brief_submissions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reference_code` VARCHAR(32) NOT NULL UNIQUE,
    `client_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(64) NOT NULL,
    `contact_method` VARCHAR(255) DEFAULT NULL,
    `preferred_time` VARCHAR(255) DEFAULT NULL,
    `store_name` VARCHAR(255) DEFAULT NULL,
    `budget` VARCHAR(128) DEFAULT NULL,
    `timeline` VARCHAR(128) DEFAULT NULL,
    `status` ENUM('new', 'in_review', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'new',
    `answers_json` LONGTEXT NOT NULL COMMENT 'JSON formatted responses for all 34 questions',
    `notes` TEXT DEFAULT NULL COMMENT 'Internal manager notes and remarks',
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_ref` (`reference_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table for admin authentication
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(64) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'admin',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_login` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Default Admin User: admin / admin123
-- Hash generated via password_hash('admin123', PASSWORD_BCRYPT)
INSERT INTO `admin_users` (`username`, `password_hash`, `email`, `role`, `created_at`)
VALUES ('admin', '$2y$10$T1qLqKjZ7j8Kk2yO6z5I6Oqf6b8D4V2Y8A5F9K3P4M2L1N0Q7R8S.', 'admin@brief.local', 'admin', NOW())
ON DUPLICATE KEY UPDATE `username` = `username`;
