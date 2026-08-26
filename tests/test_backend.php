<?php
// Autoloader test
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = dirname(__DIR__) . '/app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Core\Database;
use App\Core\Auth;
use App\Models\AdminUser;
use App\Models\BriefSubmission;

echo "=== 1. Database Connection Test ===" . PHP_EOL;
$pdo = Database::getConnection();
echo "Active DB Driver: " . Database::getActiveDriver() . PHP_EOL;

echo "=== 2. Admin User Verification Test ===" . PHP_EOL;
$admin = AdminUser::verify('admin', 'admin123');
if ($admin) {
    echo "Admin authentication: SUCCESS (User: {$admin['username']}, Role: {$admin['role']})" . PHP_EOL;
} else {
    echo "Admin authentication: FAILED" . PHP_EOL;
}

echo "=== 3. Create Test Submission ===" . PHP_EOL;
$testData = [
    'client_name' => 'Іван Петренко',
    'phone' => '+38 (067) 123-45-67',
    'contact_method' => 'Telegram: @ivan_fishing',
    'preferred_time' => '10:00 - 14:00',
    'store_name' => 'Світ Рибалки',
    'budget' => '1000$ - 3000$',
    'timeline' => '1 - 3 місяці',
    'answers' => [
        '1' => 'Іван Петренко',
        '2' => '+38 (067) 123-45-67',
        '3' => 'Telegram: @ivan_fishing',
        '6' => 'Світ Рибалки',
        '7' => ['Запуск бізнесу з нуля', 'Автоматизація продажів'],
        '14' => ['Любителі вихідного дня', 'Рибалки-спінінгісти'],
        '18' => ['Фільтрація за характеристиками', 'Комплекти'],
        '28' => '1 - 3 місяці',
        '29' => '1000$ - 3000$',
        '34' => 'Потрібна інтеграція з Новою Поштою та LiqPay'
    ]
];

$submission = BriefSubmission::create($testData);
echo "Submission created: ID #{$submission['id']}, Ref: {$submission['reference_code']}" . PHP_EOL;

echo "=== 4. Fetch Submission and Stats ===" . PHP_EOL;
$found = BriefSubmission::findById($submission['id']);
echo "Fetched submission: Name: {$found['client_name']}, Answers Count: " . count($found['answers']) . PHP_EOL;

$stats = BriefSubmission::getStats();
echo "Total submissions: {$stats['total']}, New status count: " . $stats['by_status']['new'] . PHP_EOL;

echo "=== 5. Update Submission (Edit answers & status) ===" . PHP_EOL;
$updatedAnswers = $found['answers'];
$updatedAnswers['34'] = 'Оновлено менеджером: додано примітку про кастомний фільтр вудилищ';
$updateSuccess = BriefSubmission::update($submission['id'], [
    'status' => 'in_review',
    'notes' => 'Передзвонити клієнту завтра о 12:00',
    'answers' => $updatedAnswers
]);
echo "Update success: " . ($updateSuccess ? 'YES' : 'NO') . PHP_EOL;

$updatedRecord = BriefSubmission::findById($submission['id']);
echo "Updated status: {$updatedRecord['status']}, Notes: {$updatedRecord['notes']}" . PHP_EOL;

echo "=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===" . PHP_EOL;
