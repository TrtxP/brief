<?php
namespace App\Core;

/**
 * Authentication Manager
 * Handles Admin authentication via session and HMAC tokens
 */
class Auth
{
    private static string $secretKey = 'brief_default_secret_key_change_in_production';

    public static function init(string $secret): void
    {
        self::$secretKey = $secret;
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start([
                'cookie_lifetime' => 86400 * 7,
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax'
            ]);
        }
    }

    public static function createToken(array $user): string
    {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'] ?? 'admin',
            'exp' => time() + (86400 * 7) // 7 days
        ]));

        $signature = hash_hmac('sha256', "{$header}.{$payload}", self::$secretKey);
        return "{$header}.{$payload}.{$signature}";
    }

    public static function verifyToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $expectedSignature = hash_hmac('sha256', "{$header}.{$payload}", self::$secretKey);

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $data = json_decode(base64_decode($payload), true);
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }

        return $data;
    }

    /**
     * Checks if current request is authenticated via Bearer token or active PHP Session
     */
    public static function user(): ?array
    {
        // 1. Check Authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $tokenData = self::verifyToken($matches[1]);
            if ($tokenData) {
                return $tokenData;
            }
        }

        // 2. Check Session
        if (isset($_SESSION['admin_user'])) {
            return $_SESSION['admin_user'];
        }

        return null;
    }

    public static function login(array $user): string
    {
        $_SESSION['admin_user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'] ?? 'admin'
        ];

        return self::createToken($user);
    }

    public static function logout(): void
    {
        unset($_SESSION['admin_user']);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }
}
