<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Auth;
use App\Core\Validator;
use App\Models\AdminUser;
use App\Models\BriefSubmission;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Admin Panel Controller
 */
class AdminController extends Controller
{
    /**
     * Admin login
     * POST /api/admin/login
     */
    public function login(): void
    {
        $input = $this->getJsonInput();
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Вкажіть логін та пароль.'
            ], 422);
        }

        $user = AdminUser::verify($username, $password);
        if (!$user) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Невірний логін або пароль.'
            ], 401);
        }

        $token = Auth::login($user);

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'Успішний вхід до панелі керування.',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ],
                'token' => $token
            ]
        ]);
    }

    /**
     * Check current admin session
     * GET /api/admin/me
     */
    public function me(): void
    {
        $user = $this->requireAdmin();
        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Admin logout
     * POST /api/admin/logout
     */
    public function logout(): void
    {
        Auth::logout();
        $this->jsonResponse([
            'status' => 'success',
            'message' => 'Ви успішно вийшли із системи.'
        ]);
    }

    /**
     * Get paginated submissions & analytics
     * GET /api/admin/submissions
     */
    public function getSubmissions(): void
    {
        $this->requireAdmin();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));

        $filters = [
            'status' => $_GET['status'] ?? 'all',
            'search' => $_GET['search'] ?? '',
            'date_from' => $_GET['date_from'] ?? '',
            'date_to' => $_GET['date_to'] ?? ''
        ];

        $data = BriefSubmission::getAll($filters, $page, $perPage);
        $stats = BriefSubmission::getStats();

        $this->jsonResponse([
            'status' => 'success',
            'data' => [
                'submissions' => $data['items'],
                'pagination' => $data['pagination'],
                'stats' => $stats
            ]
        ]);
    }

    /**
     * Get single submission detail with all answers
     * GET /api/admin/submissions/{id}
     */
    public function getSubmission(string $id): void
    {
        $this->requireAdmin();

        $submission = BriefSubmission::findById((int)$id);
        if (!$submission) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Бриф не знайдено.'
            ], 404);
        }

        $this->jsonResponse([
            'status' => 'success',
            'data' => $submission
        ]);
    }

    /**
     * Full edit of recorded answers and metadata
     * PATCH /api/admin/submissions/{id}
     */
    public function updateSubmission(string $id): void
    {
        $this->requireAdmin();

        $submissionId = (int)$id;
        $submission = BriefSubmission::findById($submissionId);
        if (!$submission) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Бриф не знайдено.'
            ], 404);
        }

        $input = $this->getJsonInput();

        $updateData = [];

        if (isset($input['client_name'])) {
            $updateData['client_name'] = $input['client_name'];
        }
        if (isset($input['phone'])) {
            $updateData['phone'] = $input['phone'];
        }
        if (isset($input['contact_method'])) {
            $updateData['contact_method'] = $input['contact_method'];
        }
        if (isset($input['preferred_time'])) {
            $updateData['preferred_time'] = $input['preferred_time'];
        }
        if (isset($input['store_name'])) {
            $updateData['store_name'] = $input['store_name'];
        }
        if (isset($input['budget'])) {
            $updateData['budget'] = $input['budget'];
        }
        if (isset($input['timeline'])) {
            $updateData['timeline'] = $input['timeline'];
        }
        if (isset($input['status'])) {
            $updateData['status'] = $input['status'];
        }
        if (isset($input['notes'])) {
            $notesErr = Validator::validateTextarea($input['notes'], 'Нотатки менеджера', 2000);
            if ($notesErr) {
                $this->jsonResponse([
                    'status' => 'error',
                    'message' => $notesErr
                ], 422);
            }
            $updateData['notes'] = $input['notes'];
        }
        if (isset($input['answers']) && is_array($input['answers'])) {
            $ansErrors = Validator::validateBriefAnswers($input['answers']);
            if (!empty($ansErrors)) {
                $this->jsonResponse([
                    'status' => 'error',
                    'message' => 'Помилки валідації відповідей: ' . implode('; ', $ansErrors),
                    'errors' => $ansErrors
                ], 422);
            }
            $updateData['answers'] = $input['answers'];
        }

        $success = BriefSubmission::update($submissionId, $updateData);

        if (!$success) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Не вдалося зберегти зміни.'
            ], 400);
        }

        $updated = BriefSubmission::findById($submissionId);

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'Дані брифу успішно оновлено!',
            'data' => $updated
        ]);
    }

    /**
     * Quick status update
     * PATCH /api/admin/submissions/{id}/status
     */
    public function updateStatus(string $id): void
    {
        $this->requireAdmin();

        $input = $this->getJsonInput();
        $status = $input['status'] ?? '';
        $validStatuses = ['new', 'in_review', 'approved', 'rejected', 'completed'];

        if (!in_array($status, $validStatuses, true)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Недійсний статус.'
            ], 422);
        }

        $success = BriefSubmission::update((int)$id, ['status' => $status]);

        $this->jsonResponse([
            'status' => $success ? 'success' : 'error',
            'message' => $success ? 'Статус успішно змінено.' : 'Помилка оновлення статусу.'
        ]);
    }

    /**
     * Delete submission
     * DELETE /api/admin/submissions/{id}
     */
    public function deleteSubmission(string $id): void
    {
        $this->requireAdmin();

        $success = BriefSubmission::delete((int)$id);

        $this->jsonResponse([
            'status' => $success ? 'success' : 'error',
            'message' => $success ? 'Бриф видалено.' : 'Не вдалося видалити бриф.'
        ]);
    }

    /**
     * Memory-efficient export of submissions (CSV / JSON stream)
     * GET /api/admin/export?format=csv|json
     */
    public function export(): void
    {
        $this->requireAdmin();

        $format = strtolower($_GET['format'] ?? 'csv');
        $filename = 'brief_export_' . date('Y-m-d_H-i');

        if ($format === 'json') {
            header('Content-Type: application/json; charset=UTF-8');
            header("Content-Disposition: attachment; filename=\"{$filename}.json\"");

            echo "[\n";
            $first = true;
            foreach (BriefSubmission::cursorAll() as $row) {
                if (!$first) {
                    echo ",\n";
                }
                echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                $first = false;
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
            echo "\n]";
            exit;
        }

        if ($format == 'xlsx') {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Брифи');

            $sheet->fromArray([
                'ID',
                'Код брифу',
                'Клієнт',
                'Телефон',
                'Спосіб зв\'язку',
                'Зручний час',
                'Назва магазину',
                'Бюджет',
                'Терміни',
                'Статус',
                'Нотатки менеджера',
                'Дата створення',
                'Всі відповіді (JSON)',
            ], null, 'A1');

            $rowNumber = 2;

            foreach (BriefSubmission::cursorAll() as $row) {
                $sheet->fromArray([[
                    $row['id'],
                    $row['reference_code'],
                    $row['client_name'],
                    $row['phone'],
                    $row['contact_method'],
                    $row['preferred_time'],
                    $row['store_name'],
                    $row['budget'],
                    $row['timeline'],
                    $row['status'],
                    $row['notes'],
                    $row['created_at'],
                    $row['answers_json']
                ]], null, "A{$rowNumber}");

                $rowNumber++;
            }

            $sheet->freezePane('A2');
            $sheet->setAutoFilter($sheet->calculateWorksheetDimension());

            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8');
            header("Content-Disposition: attachment; filename=\"{$filename}.xlsx\"");
            header('Cache-Control: max-age=0');

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');

            $spreadsheet->disconnectWorksheets();
            exit;
        }

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // Default: CSV export with BOM for UTF-8 Excel support
        header('Content-Type: text/csv; charset=UTF-8');
        header("Content-Disposition: attachment; filename=\"{$filename}.csv\"");

        $output = fopen('php://output', 'w');
        // UTF-8 BOM for Excel
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // CSV Header
        fputcsv($output, [
            'ID',
            'Код брифу',
            'Клієнт',
            'Телефон',
            'Спосіб зв\'язку',
            'Зручний час',
            'Назва магазину',
            'Бюджет',
            'Терміни',
            'Статус',
            'Нотатки менеджера',
            'Дата створення',
            'Всі відповіді (JSON)'
        ], ';');

        foreach (BriefSubmission::cursorAll() as $row) {
            fputcsv($output, [
                $row['id'],
                $row['reference_code'],
                $row['client_name'],
                $row['phone'],
                $row['contact_method'],
                $row['preferred_time'],
                $row['store_name'],
                $row['budget'],
                $row['timeline'],
                $row['status'],
                $row['notes'],
                $row['created_at'],
                json_encode($row['answers'], JSON_UNESCAPED_UNICODE)
            ], ';');

            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }

        fclose($output);
        exit;
    }
}
