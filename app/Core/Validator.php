<?php
namespace App\Core;

/**
 * Security & Input Validator
 * Validates brief question responses using regex patterns to ensure security against XSS, injection,
 * and malicious payloads, while permitting rich Ukrainian and international text formatting.
 */
class Validator
{
    // Regex pattern to detect dangerous HTML and script tags
    public const PATTERN_DANGEROUS_TAGS = '/<\s*(script|iframe|object|embed|applet|meta|link|style|svg|form|input|button|base)\b[^>]*>/i';

    // Regex pattern to detect inline JavaScript event handlers (e.g. onload=, onclick=, onerror=)
    public const PATTERN_EVENT_HANDLERS = '/\bon[a-z]{3,20}\s*=\s*[\'"][^\'"]*[\'"]/i';

    // Regex pattern to detect dangerous URI schemes
    public const PATTERN_DANGEROUS_PROTOCOLS = '/(javascript|vbscript|data\s*:\s*text\/html)\s*:/i';

    // Regex pattern to detect forbidden non-printable ASCII control characters
    public const PATTERN_FORBIDDEN_CONTROL_CHARS = '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u';

    // Regex pattern for safe multi-line textarea text (allows Cyrillic, Latin, numbers, whitespace, standard punctuation & symbols)
    public const PATTERN_SAFE_TEXTAREA = '/^[\p{L}\p{N}\p{P}\p{S}\p{Z}\r\n\t]+$/u';

    // Default maximum character limits
    public const MAX_TEXTAREA_LENGTH = 5000;
    public const MAX_INPUT_LENGTH = 500;

    /**
     * Map of known textarea question IDs in the fishing store brief
     */
    public const TEXTAREA_QUESTIONS = [
        '10' => 'Питання #10 (Портрет цільового покупця)',
        '11' => 'Питання #11 (Основні конкуренти)',
        '12' => 'Питання #12 (Сильні та слабкі сторони конкурентів)',
        '25' => 'Питання #25 (Специфічні бізнес-процеси)',
        '26' => 'Питання #26 (Маркетингові інструменти)',
        '34' => 'Питання #34 (Додаткові побажання та коментарі)'
    ];

    /**
     * Validate a multi-line textarea value against security patterns
     *
     * @param string|null $value Input string
     * @param string $fieldLabel Descriptive label for error messages
     * @param int $maxLength Maximum allowed characters
     * @return string|null Error message or null if valid
     */
    public static function validateTextarea(?string $value, string $fieldLabel = 'Текстове поле', int $maxLength = self::MAX_TEXTAREA_LENGTH): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $trimmed = trim($value);

        // 1. Length validation
        if (mb_strlen($trimmed, 'UTF-8') > $maxLength) {
            return "{$fieldLabel}: довжина тексту перевищує допустимий ліміт ({$maxLength} символів).";
        }

        // 2. Control characters validation (prevents null-byte injection & binary payloads)
        if (preg_match(self::PATTERN_FORBIDDEN_CONTROL_CHARS, $trimmed)) {
            return "{$fieldLabel}: виявлено заборонені недруковані керуючі символи або нульовий байт.";
        }

        // 3. Dangerous HTML/XSS tag validation
        if (preg_match(self::PATTERN_DANGEROUS_TAGS, $trimmed)) {
            return "{$fieldLabel}: текст містить неприпустимі HTML-теги або скрипти.";
        }

        // 4. Inline JavaScript event handlers validation
        if (preg_match(self::PATTERN_EVENT_HANDLERS, $trimmed)) {
            return "{$fieldLabel}: текст містить небезпечні атрибути або обробники подій JavaScript.";
        }

        // 5. Dangerous protocols validation
        if (preg_match(self::PATTERN_DANGEROUS_PROTOCOLS, $trimmed)) {
            return "{$fieldLabel}: текст містить заборонені протоколи (javascript:, data:).";
        }

        // 6. Safe Unicode character set pattern validation
        if (!preg_match(self::PATTERN_SAFE_TEXTAREA, $trimmed)) {
            return "{$fieldLabel}: текст містить неприпустимі спецсимволи.";
        }

        return null;
    }

    /**
     * Validate a single line text input
     *
     * @param string|null $value
     * @param string $fieldLabel
     * @param int $maxLength
     * @return string|null
     */
    public static function validateTextInput(?string $value, string $fieldLabel = 'Текстове поле', int $maxLength = self::MAX_INPUT_LENGTH): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $trimmed = trim($value);

        if (mb_strlen($trimmed, 'UTF-8') > $maxLength) {
            return "{$fieldLabel}: довжина рядка не повинна перевищувати {$maxLength} символів.";
        }

        return self::validateTextarea($trimmed, $fieldLabel, $maxLength);
    }

    /**
     * Validate all brief answers (specifically checking textarea fields and custom inputs)
     *
     * @param array $answers
     * @return array List of validation error strings
     */
    public static function validateBriefAnswers(array $answers): array
    {
        $errors = [];

        foreach ($answers as $qId => $answer) {
            $idStr = (string)$qId;

            // Check if this is a known textarea question
            if (isset(self::TEXTAREA_QUESTIONS[$idStr])) {
                $label = self::TEXTAREA_QUESTIONS[$idStr];
                if (is_string($answer)) {
                    $err = self::validateTextarea($answer, $label);
                    if ($err) {
                        $errors[] = $err;
                    }
                }
            } elseif (is_string($answer)) {
                // Validate other general text/custom inputs
                $label = "Питання #{$idStr}";
                $err = self::validateTextInput($answer, $label);
                if ($err) {
                    $errors[] = $err;
                }
            } elseif (is_array($answer)) {
                // Check items in checkbox arrays (e.g. "Інше: ...")
                foreach ($answer as $item) {
                    if (is_string($item)) {
                        $label = "Питання #{$idStr} (варіант відповіді)";
                        $err = self::validateTextInput($item, $label);
                        if ($err) {
                            $errors[] = $err;
                        }
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Sanitize text by stripping malicious code and null bytes while keeping safe multi-line text
     *
     * @param string $value
     * @return string
     */
    public static function sanitize(string $value): string
    {
        $value = str_replace(chr(0), '', $value);
        $value = preg_replace(self::PATTERN_DANGEROUS_TAGS, '', $value) ?? $value;
        $value = preg_replace(self::PATTERN_EVENT_HANDLERS, '', $value) ?? $value;
        $value = preg_replace(self::PATTERN_DANGEROUS_PROTOCOLS, '', $value) ?? $value;
        $value = str_replace(["\r\n", "\r"], "\n", $value);
        return trim($value);
    }
}
