<?php
/**
 * Front Controller — Entry Point for PHP MVC Application
 * Compatible with WAMP Server, Byethost and PHP Built-in Server
 */

// 1. Detect Base URL for WAMP Subdirectories (e.g. /brief)
$scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
if (str_ends_with($scriptName, 'index.php')) {
    $scriptDir = dirname($scriptName);
    $baseUrl = ($scriptDir === '/' || $scriptDir === '\\' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');
} else {
    $baseUrl = '';
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/';

$cleanPath = $path;
if (!empty($baseUrl) && str_starts_with($cleanPath, $baseUrl)) {
    $cleanPath = substr($cleanPath, strlen($baseUrl));
}
$cleanPath = '/' . trim($cleanPath, '/');

// Direct static file delivery for assets from view/
if (preg_match('#^/assets/(.+\.(js|css|svg|png|jpg|jpeg|webp|woff2|woff|ttf|ico))$#i', $cleanPath, $assetMatch)) {
    $assetFile = __DIR__ . '/view/assets/' . $assetMatch[1];
    if (file_exists($assetFile)) {
        $ext = strtolower($assetMatch[2]);
        $mimeMap = [
            'js' => 'application/javascript; charset=UTF-8',
            'css' => 'text/css; charset=UTF-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'ttf' => 'font/ttf',
            'ico' => 'image/x-icon'
        ];
        header("Content-Type: " . ($mimeMap[$ext] ?? 'application/octet-stream'));
        header("Cache-Control: public, max-age=3600, must-revalidate");
        header("Content-Length: " . filesize($assetFile));
        readfile($assetFile);
        exit;
    }
}

// 2. PSR-4 Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// 3. Load Configuration
$config = require __DIR__ . '/config/config.php';

// 4. Initialize Output Buffer and Memory Optimization
use App\Core\OutputBuffer;
use App\Core\Auth;
use App\Core\Router;
use App\Controllers\BriefController;
use App\Controllers\AdminController;
use App\Controllers\HomeController;

OutputBuffer::init($config['buffer'] ?? []);
Auth::init($config['secret_key'] ?? 'brief_secret_key');

// 5. Handle CORS for local Vite development (http://localhost:5173)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['cors_allowed_origins'] ?? ['http://localhost:5173'];

if (in_array($origin, $allowedOrigins, true) || $config['is_dev']) {
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 6. Define Routes
// Public Brief Endpoints
Router::post('/api/brief', [BriefController::class, 'submit']);
Router::get('/api/brief/status/{ref}', [BriefController::class, 'checkStatus']);

// Admin Authentication Endpoints
Router::post('/api/admin/login', [AdminController::class, 'login']);
Router::get('/api/admin/me', [AdminController::class, 'me']);
Router::post('/api/admin/logout', [AdminController::class, 'logout']);

// Admin Management Endpoints
Router::get('/api/admin/submissions', [AdminController::class, 'getSubmissions']);
Router::get('/api/admin/submissions/{id}', [AdminController::class, 'getSubmission']);
Router::patch('/api/admin/submissions/{id}', [AdminController::class, 'updateSubmission']);
Router::patch('/api/admin/submissions/{id}/status', [AdminController::class, 'updateStatus']);
Router::delete('/api/admin/submissions/{id}', [AdminController::class, 'deleteSubmission']);
Router::get('/api/admin/export', [AdminController::class, 'export']);

// Fallback Route for SPA
Router::fallback([HomeController::class, 'index']);

// 7. Dispatch Request
Router::dispatch($requestUri, $_SERVER['REQUEST_METHOD'], $baseUrl);

// 8. Flush Output Buffer
OutputBuffer::flush();
