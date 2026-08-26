<?php
namespace App\Core;

use PDO;
use PDOException;

/**
 * Database Singleton
 * Supports MySQL (WAMP / Byethost) with resilient auto-init & fallback
 */
class Database
{
    private static ?PDO $instance = null;
    private static string $activeDriver = 'mysql';

    private function __construct() {}
    private function __clone() {}

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            self::connect();
        }
        return self::$instance;
    }

    public static function getActiveDriver(): string
    {
        return self::$activeDriver;
    }

    private static function connect(): void
    {
        $dbConfig = require dirname(__DIR__, 2) . '/config/database.php';
        $mysql = $dbConfig['mysql'];

        try {
            // First attempt: Connect to MySQL with configured dbname
            $dsn = "mysql:host={$mysql['host']};port={$mysql['port']};dbname={$mysql['dbname']};charset={$mysql['charset']}";
            self::$instance = new PDO($dsn, $mysql['username'], $mysql['password'], $mysql['options']);
            self::$activeDriver = 'mysql';
        } catch (PDOException $e) {
            // If database doesn't exist, try connecting without dbname and create it
            if (str_contains($e->getMessage(), 'Unknown database') || $e->getCode() == 1049) {
                try {
                    $rootDsn = "mysql:host={$mysql['host']};port={$mysql['port']};charset={$mysql['charset']}";
                    $tempPdo = new PDO($rootDsn, $mysql['username'], $mysql['password']);
                    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$mysql['dbname']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    unset($tempPdo);

                    self::$instance = new PDO($dsn, $mysql['username'], $mysql['password'], $mysql['options']);
                    self::$activeDriver = 'mysql';
                    self::initializeSchema(self::$instance);
                    return;
                } catch (PDOException $innerE) {
                    // Could not create DB
                }
            }

            // Fallback: If MySQL is not running on localhost, fallback to SQLite for immediate local CLI zero-friction development
            $sqlitePath = $dbConfig['sqlite']['path'];
            $sqliteDir = dirname($sqlitePath);
            if (!is_dir($sqliteDir)) {
                mkdir($sqliteDir, 0777, true);
            }

            $dsn = "sqlite:" . $sqlitePath;
            self::$instance = new PDO($dsn, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            self::$activeDriver = 'sqlite';
            self::initializeSqliteSchema(self::$instance);
        }

        if (self::$activeDriver === 'mysql') {
            self::initializeSchema(self::$instance);
        }
    }

    private static function initializeSchema(PDO $pdo): void
    {
        try {
            $pdo->exec("
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
                    `status` VARCHAR(32) NOT NULL DEFAULT 'new',
                    `answers_json` LONGTEXT NOT NULL,
                    `notes` TEXT DEFAULT NULL,
                    `ip_address` VARCHAR(45) DEFAULT NULL,
                    `user_agent` TEXT DEFAULT NULL,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_status` (`status`),
                    INDEX `idx_created_at` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `admin_users` (
                    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    `username` VARCHAR(64) NOT NULL UNIQUE,
                    `password_hash` VARCHAR(255) NOT NULL,
                    `email` VARCHAR(255) DEFAULT NULL,
                    `role` VARCHAR(32) NOT NULL DEFAULT 'admin',
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `last_login` DATETIME DEFAULT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            // Seed default admin (admin / admin123) if empty
            $stmt = $pdo->query("SELECT COUNT(*) FROM `admin_users`");
            if ($stmt && (int)$stmt->fetchColumn() === 0) {
                $hash = password_hash('admin123', PASSWORD_BCRYPT);
                $seed = $pdo->prepare("INSERT INTO `admin_users` (`username`, `password_hash`, `email`, `role`) VALUES (?, ?, ?, ?)");
                $seed->execute(['admin', $hash, 'admin@brief.local', 'admin']);
            }
        } catch (PDOException $e) {
            // Ignore schema creation if already existing
        }
    }

    private static function initializeSqliteSchema(PDO $pdo): void
    {
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `brief_submissions` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
                    `reference_code` TEXT NOT NULL UNIQUE,
                    `client_name` TEXT NOT NULL,
                    `phone` TEXT NOT NULL,
                    `contact_method` TEXT,
                    `preferred_time` TEXT,
                    `store_name` TEXT,
                    `budget` TEXT,
                    `timeline` TEXT,
                    `status` TEXT NOT NULL DEFAULT 'new',
                    `answers_json` TEXT NOT NULL,
                    `notes` TEXT,
                    `ip_address` TEXT,
                    `user_agent` TEXT,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS `admin_users` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
                    `username` TEXT NOT NULL UNIQUE,
                    `password_hash` TEXT NOT NULL,
                    `email` TEXT,
                    `role` TEXT NOT NULL DEFAULT 'admin',
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `last_login` DATETIME
                );
            ");

            $stmt = $pdo->query("SELECT COUNT(*) FROM `admin_users`");
            if ($stmt && (int)$stmt->fetchColumn() === 0) {
                $hash = password_hash('admin123', PASSWORD_BCRYPT);
                $seed = $pdo->prepare("INSERT INTO `admin_users` (`username`, `password_hash`, `email`, `role`) VALUES (?, ?, ?, ?)");
                $seed->execute(['admin', $hash, 'admin@brief.local', 'admin']);
            }
        } catch (PDOException $e) {
            // Ignore
        }
    }
}
