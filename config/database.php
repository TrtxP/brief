<?php
/**
 * Database Configuration
 * Configured for MySQL (WAMP Server & Byethost)
 */

return [
    'driver' => 'mysql', // 'mysql' (standard for WAMP & Byethost)
    
    // MySQL Settings (WAMP Server defaults)
    'mysql' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'dbname' => getenv('DB_NAME') ?: 'brief_db',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    ],
    
    // SQLite Fallback (Optional, for zero-config quick local development when MySQL is offline)
    'sqlite' => [
        'path' => dirname(__DIR__) . '/database/brief.sqlite'
    ]
];
