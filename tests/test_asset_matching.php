<?php
$_SERVER['REQUEST_URI'] = '/assets/index.css';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['SCRIPT_NAME'] = '/index.php';

$config = require dirname(__DIR__) . '/config/config.php';
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$baseUrl = $config['base_url'];
$cleanPath = $path;
if (!empty($baseUrl) && str_starts_with($cleanPath, $baseUrl)) {
    $cleanPath = substr($cleanPath, strlen($baseUrl));
}
$cleanPath = '/' . trim($cleanPath, '/');
echo "cleanPath: {$cleanPath}" . PHP_EOL;

if (preg_match('#^/assets/(.+\.(js|css|svg|png|jpg|jpeg|webp|woff2|woff|ttf|ico))$#i', $cleanPath, $assetMatch)) {
    echo "Matched asset: {$assetMatch[1]}" . PHP_EOL;
    $assetFile = dirname(__DIR__) . '/view/assets/' . $assetMatch[1];
    echo "Asset file: {$assetFile} (exists: " . (file_exists($assetFile) ? 'YES' : 'NO') . ")" . PHP_EOL;
} else {
    echo "No match" . PHP_EOL;
}
