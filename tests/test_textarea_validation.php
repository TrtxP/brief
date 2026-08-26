<?php
/**
 * PHP Unit Tests for Brief Textarea Regex Validation & Security Checks
 */

require_once __DIR__ . '/../app/Core/Validator.php';
require_once __DIR__ . '/../app/Core/OutputBuffer.php';
require_once __DIR__ . '/../app/Core/Auth.php';
require_once __DIR__ . '/../app/Core/Database.php';
require_once __DIR__ . '/../app/Core/Model.php';
require_once __DIR__ . '/../app/Models/BriefSubmission.php';

use App\Core\Validator;

$passed = 0;
$failed = 0;

function assertTest(string $title, bool $condition, string $details = ''): void {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo " [PASS] {$title}\n";
    } else {
        $failed++;
        echo " [FAIL] {$title} -- {$details}\n";
    }
}

echo "==========================================================\n";
echo "  RUNNING UNIT TESTS: TEXTAREA REGEX & SECURITY VALIDATION\n";
echo "==========================================================\n\n";

// --- TEST GROUP 1: Valid Ukrainian & Multi-line Content ---
$validUkrainianText = "Потрібна повна інтеграція з 1С:Підприємство та Новою Поштою.\n" .
    "- Каталог товарів: до 15 000 SKU;\n" .
    "- Оплата: LiqPay, WayForPay, безготівковий розрахунок із ПДВ;\n" .
    "- Доставка: кур'єрська служба, поштомати.\n" .
    "Особливі побажання: наявність фільтрів за тестом вудилища (5-25g) та довжиною (2.1м - 3.6м).";

$err1 = Validator::validateTextarea($validUkrainianText, 'Питання #34');
assertTest("1.1 Valid Ukrainian multiline text passes", $err1 === null, $err1 ?? '');

$validCompetitorText = "Основні конкуренти:\n1. Flagman (https://flagman.kiev.ua) - широкий асортимент;\n2. Ibis (https://ibis.net.ua) - преміум снасті;\n3. Fish-Market.";
$err2 = Validator::validateTextarea($validCompetitorText, 'Питання #11');
assertTest("1.2 Valid competitor analysis with URLs and punctuation passes", $err2 === null, $err2 ?? '');

$emptyText = "   \n\t  ";
$err3 = Validator::validateTextarea($emptyText, 'Питання #10');
assertTest("1.3 Empty / whitespace-only textarea is allowed as optional", $err3 === null, $err3 ?? '');

// --- TEST GROUP 2: XSS & Malicious Script Injections ---
$xssScript = "Хочу такий функціонал: <script>alert('XSS_ATTACK')</script>";
$errXss1 = Validator::validateTextarea($xssScript, 'Питання #34');
assertTest("2.1 Rejects <script> tag injection", $errXss1 !== null && str_contains($errXss1, 'неприпустимі HTML-теги'));

$xssIframe = "Побажання: <iframe src='http://attacker.com/steal-cookie'></iframe>";
$errXss2 = Validator::validateTextarea($xssIframe, 'Питання #34');
assertTest("2.2 Rejects <iframe> embedding", $errXss2 !== null && str_contains($errXss2, 'неприпустимі HTML-теги'));

$xssSvg = "Логотип: <svg/onload=alert('XSS')>";
$errXss3 = Validator::validateTextarea($xssSvg, 'Питання #34');
assertTest("2.3 Rejects <svg> XSS vector", $errXss3 !== null);

$xssEventHandler = "Кнопка <div onclick='eval(atob(\"...\"))'>Натисни тут</div>";
$errXss4 = Validator::validateTextarea($xssEventHandler, 'Питання #34');
assertTest("2.4 Rejects inline JavaScript event handlers (onclick=)", $errXss4 !== null);

$xssJsProtocol = "Посилання на наш старий сайт: javascript:alert(document.cookie)";
$errXss5 = Validator::validateTextarea($xssJsProtocol, 'Питання #34');
assertTest("2.5 Rejects dangerous javascript: pseudo-protocol", $errXss5 !== null && str_contains($errXss5, 'заборонені протоколи'));

// --- TEST GROUP 3: Binary & Control Character Injections ---
$nullBytePayload = "Текст із прихованим байтом" . chr(0) . " закінчення";
$errNull = Validator::validateTextarea($nullBytePayload, 'Питання #25');
assertTest("3.1 Rejects null-byte injection (\\0)", $errNull !== null && str_contains($errNull, 'недруковані керуючі символи'));

$controlCharsPayload = "Текст із ANSI escape кодом \x1B[31mЧервоний\x1B[0m";
$errCtrl = Validator::validateTextarea($controlCharsPayload, 'Питання #25');
assertTest("3.2 Rejects non-printable control characters", $errCtrl !== null);

// --- TEST GROUP 4: Length Boundary Conditions ---
$normalLength = str_repeat("Тестовий опис вимог до інтернет-магазину риболовлі. ", 50); // ~2600 chars
$errLenNormal = Validator::validateTextarea($normalLength, 'Питання #34', 5000);
assertTest("4.1 Content within 5000 chars limit passes", $errLenNormal === null);

$overlyLong = str_repeat("А", 5001);
$errLenOver = Validator::validateTextarea($overlyLong, 'Питання #34', 5000);
assertTest("4.2 Rejects content exceeding 5000 chars limit", $errLenOver !== null && str_contains($errLenOver, 'перевищує допустимий ліміт'));

// --- TEST GROUP 5: Full Brief Answers Validation ---
$validAnswers = [
    '1' => 'Дмитро Олександрович',
    '2' => '+380671234567',
    '10' => "Цільова аудиторія:\n- Рибалки-любителі (25-45 років)\n- Професійні спортсмени спінінгісти\n- Власники риболовних баз",
    '11' => "Flagman, Fishing-ROI, Salmo",
    '34' => "Бажано запустити першу версію сайту до початку весняного сезону."
];
$allErrorsValid = Validator::validateBriefAnswers($validAnswers);
assertTest("5.1 Complete valid brief answers structure passes", empty($allErrorsValid), json_encode($allErrorsValid));

$invalidAnswers = [
    '1' => 'Дмитро',
    '2' => '+380671234567',
    '10' => "ЦА: <script>fetch('http://evil.com')</script>",
    '34' => "Додатково: javascript:void(0)"
];
$allErrorsInvalid = Validator::validateBriefAnswers($invalidAnswers);
assertTest("5.2 Identifies multiple security violations across brief textarea fields", count($allErrorsInvalid) >= 2);

// --- TEST GROUP 6: Sanitization Helper ---
$dirtyString = "Привіт <script>alert(1)</script> Світ! \r\nНовий рядок." . chr(0);
$cleanedString = Validator::sanitize($dirtyString);
assertTest("6.1 Sanitizer strips dangerous tags, null bytes, and normalizes line breaks",
    !str_contains($cleanedString, '<script>') && !str_contains($cleanedString, chr(0)) && str_contains($cleanedString, 'Привіт') && str_contains($cleanedString, 'Світ!'));

echo "\n==========================================================\n";
echo "  UNIT TESTS SUMMARY: Passed: {$passed}, Failed: {$failed}\n";
echo "==========================================================\n";

if ($failed > 0) {
    exit(1);
}
exit(0);
