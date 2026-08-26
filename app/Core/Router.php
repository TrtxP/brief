<?php
namespace App\Core;

/**
 * Lightweight & Fast HTTP REST Router
 */
class Router
{
    private static array $routes = [];
    private static mixed $fallbackHandler = null;

    public static function get(string $path, $handler): void
    {
        self::addRoute('GET', $path, $handler);
    }

    public static function post(string $path, $handler): void
    {
        self::addRoute('POST', $path, $handler);
    }

    public static function put(string $path, $handler): void
    {
        self::addRoute('PUT', $path, $handler);
    }

    public static function delete(string $path, $handler): void
    {
        self::addRoute('DELETE', $path, $handler);
    }

    public static function options(string $path, $handler): void
    {
        self::addRoute('OPTIONS', $path, $handler);
    }

    public static function fallback($handler): void
    {
        self::$fallbackHandler = $handler;
    }

    private static function addRoute(string $method, string $path, $handler): void
    {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';

        self::$routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => $pattern,
            'handler' => $handler
        ];
    }

    public static function dispatch(string $uri, string $method, string $baseUrl = ''): void
    {
        // Strip query string
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';

        // Strip base URL (e.g. /brief from /brief/api/...)
        if (!empty($baseUrl) && str_starts_with($path, $baseUrl)) {
            $path = substr($path, strlen($baseUrl));
        }

        $path = '/' . trim($path, '/');
        if ($path === '//') {
            $path = '/';
        }

        // Handle pre-flight CORS
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // Check defined routes
        foreach (self::$routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                self::executeHandler($route['handler'], $params);
                return;
            }
        }

        // Fallback handler (SPA frontend)
        if (self::$fallbackHandler !== null) {
            self::executeHandler(self::$fallbackHandler, ['path' => $path]);
            return;
        }

        // Not Found
        http_response_code(404);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['status' => 'error', 'message' => 'Маршрут не знайдено: ' . $path]);
    }

    private static function executeHandler($handler, array $params = []): void
    {
        if (is_callable($handler)) {
            call_user_func_array($handler, array_values($params));
            return;
        }

        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;
            if (is_string($class)) {
                $class = new $class();
            }
            call_user_func_array([$class, $method], array_values($params));
            return;
        }

        throw new \RuntimeException('Невалідний обробник маршруту.');
    }
}
