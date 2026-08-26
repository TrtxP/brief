<?php
namespace App\Core;

/**
 * Base Controller
 */
abstract class Controller
{
    /**
     * Send structured JSON response
     */
    protected function jsonResponse(array $data, int $statusCode = 200, array $headers = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');

        foreach ($headers as $name => $value) {
            header("{$name}: {$value}");
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Get and parse JSON payload from request body
     */
    protected function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?: [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Basic validation helper
     */
    protected function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleList) {
            $value = trim((string)($data[$field] ?? ''));
            $rulesArray = is_string($ruleList) ? explode('|', $ruleList) : $ruleList;

            foreach ($rulesArray as $rule) {
                if ($rule === 'required' && empty($value)) {
                    $errors[$field] = "Поле '{$field}' є обов'язковим для заповнення.";
                } elseif ($rule === 'phone' && !empty($value)) {
                    if (strlen(preg_replace('/[^0-9+]/', '', $value)) < 7) {
                        $errors[$field] = "Вкажіть коректний номер телефону.";
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Enforce admin authentication
     */
    protected function requireAdmin(): array
    {
        $user = Auth::user();
        if (!$user) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Несанкціонований доступ. Будь ласка, увійдіть в адмін-панель.'
            ], 401);
        }
        return $user;
    }
}
