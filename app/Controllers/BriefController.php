<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\Validator;
use App\Models\BriefSubmission;

/**
 * Public Brief Controller
 */
class BriefController extends Controller
{
    /**
     * Store new brief submission
     * POST /api/brief
     */
    public function submit(): void
    {
        $input = $this->getJsonInput();

        // Extract answers array
        $answers = $input['answers'] ?? [];
        if (!is_array($answers)) {
            $answers = [];
        }

        // 1. Basic validation for essential contact info (Questions 1 & 2)
        $clientName = trim($input['client_name'] ?? $answers['1'] ?? '');
        $phone = trim($input['phone'] ?? $answers['2'] ?? '');

        if (empty($clientName)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Будь ласка, вкажіть ваше ім\'я (Пункт 1).'
            ], 422);
        }

        if (empty($phone)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Будь ласка, вкажіть номер телефону для зв\'язку (Пункт 2).'
            ], 422);
        }

        // 2. Validate client name and phone using regex
        $nameError = Validator::validateTextInput($clientName, "Ім'я замовника (Пункт 1)", 150);
        if ($nameError) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => $nameError
            ], 422);
        }

        $phoneDigits = preg_replace('/[^0-9+]/', '', $phone);
        if (strlen($phoneDigits) < 7 || strlen($phoneDigits) > 20) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Вкажіть коректний номер телефону (від 7 до 20 цифр).'
            ], 422);
        }

        // 3. Validate all brief answers (specifically checking textarea fields and custom inputs via regex patterns)
        $validationErrors = Validator::validateBriefAnswers($answers);
        if (!empty($validationErrors)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Виявлено помилки валідації полів брифу: ' . implode('; ', $validationErrors),
                'errors' => $validationErrors
            ], 422);
        }

        try {
            $result = BriefSubmission::create([
                'client_name' => $clientName,
                'phone' => $phone,
                'contact_method' => $input['contact_method'] ?? $answers['3'] ?? '',
                'preferred_time' => $input['preferred_time'] ?? $answers['4'] ?? '',
                'store_name' => $input['store_name'] ?? $answers['6'] ?? '',
                'budget' => $input['budget'] ?? $answers['29'] ?? '',
                'timeline' => $input['timeline'] ?? $answers['28'] ?? '',
                'answers' => $answers
            ]);

            $this->jsonResponse([
                'status' => 'success',
                'message' => 'Бриф успішно збережено та відправлено в обробку!',
                'data' => $result
            ], 201);
        } catch (\Exception $e) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Помилка при збереженні брифу: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check submission status by reference code
     * GET /api/brief/status/{ref}
     */
    public function checkStatus(string $ref): void
    {
        $submission = BriefSubmission::findByReference($ref);
        if (!$submission) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Бриф із зазначеним кодом не знайдено.'
            ], 404);
        }

        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'reference_code' => $submission['reference_code'],
                'client_name' => $submission['client_name'],
                'store_name' => $submission['store_name'],
                'status' => $submission['status'],
                'created_at' => $submission['created_at']
            ]
        ]);
    }
}
