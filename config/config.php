<?php
/**
 * Application Configuration
 * Compatible with WAMP Server, Byethost and local PHP CLI
 */

// Error reporting: enable in development, suppress in production
$isDev = (
    (isset($_SERVER['HTTP_HOST']) && (str_contains($_SERVER['HTTP_HOST'], 'localhost') || str_contains($_SERVER['HTTP_HOST'], '127.0.0.1')))
    || php_sapi_name() === 'cli-server'
);

if ($isDev) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// Memory limit and output buffer configuration
ini_set('memory_limit', '128M');

// Dynamic base URL detection for subdirectories (e.g., http://localhost/brief/)
$scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
if (str_ends_with($scriptName, 'index.php')) {
    $scriptDir = dirname($scriptName);
    $baseUrl = ($scriptDir === '/' || $scriptDir === '\\' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');
} else {
    $baseUrl = '';
}

return [
    'app_name' => 'Структурований бриф інтернет-магазину риболовлі',
    'app_version' => '1.0.0',
    'is_dev' => $isDev,
    'base_url' => $baseUrl,
    'secret_key' => 'brief_secret_key_change_in_production_9837429874',
    
    // Allowed CORS origins for local Vite development
    'cors_allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://localhost'
    ],
    
    // Paths
    'paths' => [
        'root' => dirname(__DIR__),
        'app' => dirname(__DIR__) . '/app',
        'view' => dirname(__DIR__) . '/view',
        'database' => dirname(__DIR__) . '/database',
    ],
    
    // Output buffering & cache options
    'buffer' => [
        'enable_gzip' => true,
        'enable_etag' => true,
        'cache_max_age' => 3600, // 1 hour for static assets
    ]
];
