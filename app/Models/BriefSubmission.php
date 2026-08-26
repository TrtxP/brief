<?php
namespace App\Models;

use App\Core\Model;
use PDO;

/**
 * BriefSubmission Model
 */
class BriefSubmission extends Model
{
    /**
     * Create a new brief submission
     */
    public static function create(array $data): array
    {
        $db = self::db();

        $clientName = trim($data['client_name'] ?? $data['answers']['1'] ?? 'Гість');
        $phone = trim($data['phone'] ?? $data['answers']['2'] ?? '');
        $contactMethod = trim($data['contact_method'] ?? $data['answers']['3'] ?? '');
        $preferredTime = trim($data['preferred_time'] ?? $data['answers']['4'] ?? '');
        $storeName = trim($data['store_name'] ?? $data['answers']['6'] ?? '');
        $budget = trim($data['budget'] ?? $data['answers']['29'] ?? '');
        $timeline = trim($data['timeline'] ?? $data['answers']['28'] ?? '');

        // Format budget/timeline if array or object
        if (is_array($budget)) {
            $budget = implode(', ', $budget);
        }
        if (is_array($timeline)) {
            $timeline = implode(', ', $timeline);
        }

        // Generate unique reference code
        $refCode = 'BRF-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 5));

        $answersJson = json_encode($data['answers'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

        $stmt = $db->prepare("
            INSERT INTO `brief_submissions` 
            (`reference_code`, `client_name`, `phone`, `contact_method`, `preferred_time`, `store_name`, `budget`, `timeline`, `status`, `answers_json`, `notes`, `ip_address`, `user_agent`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, NULL, ?, ?, NOW())
        ");

        $stmt->execute([
            $refCode,
            $clientName,
            $phone,
            $contactMethod,
            $preferredTime,
            $storeName,
            $budget,
            $timeline,
            $answersJson,
            $ipAddress,
            $userAgent
        ]);

        $id = (int)$db->lastInsertId();

        return [
            'id' => $id,
            'reference_code' => $refCode,
            'client_name' => $clientName,
            'phone' => $phone,
            'status' => 'new',
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Find single submission by ID
     */
    public static function findById(int $id): ?array
    {
        $db = self::db();
        $stmt = $db->prepare("SELECT * FROM `brief_submissions` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if ($row) {
            $row['answers'] = json_decode($row['answers_json'] ?? '{}', true) ?: [];
        }

        return $row ?: null;
    }

    /**
     * Find single submission by Reference Code
     */
    public static function findByReference(string $refCode): ?array
    {
        $db = self::db();
        $stmt = $db->prepare("SELECT * FROM `brief_submissions` WHERE `reference_code` = ? LIMIT 1");
        $stmt->execute([$refCode]);
        $row = $stmt->fetch();

        if ($row) {
            $row['answers'] = json_decode($row['answers_json'] ?? '{}', true) ?: [];
        }

        return $row ?: null;
    }

    /**
     * Get paginated submissions list with filters
     */
    public static function getAll(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $db = self::db();
        $conditions = [];
        $params = [];

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $conditions[] = "`status` = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $searchTerm = '%' . trim($filters['search']) . '%';
            $conditions[] = "(`client_name` LIKE ? OR `phone` LIKE ? OR `store_name` LIKE ? OR `reference_code` LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if (!empty($filters['date_from'])) {
            $conditions[] = "`created_at` >= ?";
            $params[] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $conditions[] = "`created_at` <= ?";
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

        // Total count for pagination
        $countStmt = $db->prepare("SELECT COUNT(*) FROM `brief_submissions` {$whereClause}");
        $countStmt->execute($params);
        $totalItems = (int)$countStmt->fetchColumn();

        // Data query
        $offset = ($page - 1) * $perPage;
        $sql = "SELECT `id`, `reference_code`, `client_name`, `phone`, `contact_method`, `store_name`, `budget`, `timeline`, `status`, `notes`, `created_at`, `updated_at` 
                FROM `brief_submissions` 
                {$whereClause} 
                ORDER BY `created_at` DESC 
                LIMIT {$perPage} OFFSET {$offset}";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total_items' => $totalItems,
                'total_pages' => ceil($totalItems / $perPage) ?: 1
            ]
        ];
    }

    /**
     * Update an existing submission (Answers, Status, Notes, Client Info)
     */
    public static function update(int $id, array $data): bool
    {
        $db = self::db();
        $fields = [];
        $params = [];

        if (isset($data['client_name'])) {
            $fields[] = "`client_name` = ?";
            $params[] = trim($data['client_name']);
        }
        if (isset($data['phone'])) {
            $fields[] = "`phone` = ?";
            $params[] = trim($data['phone']);
        }
        if (isset($data['contact_method'])) {
            $fields[] = "`contact_method` = ?";
            $params[] = trim($data['contact_method']);
        }
        if (isset($data['preferred_time'])) {
            $fields[] = "`preferred_time` = ?";
            $params[] = trim($data['preferred_time']);
        }
        if (isset($data['store_name'])) {
            $fields[] = "`store_name` = ?";
            $params[] = trim($data['store_name']);
        }
        if (isset($data['budget'])) {
            $fields[] = "`budget` = ?";
            $params[] = is_array($data['budget']) ? implode(', ', $data['budget']) : trim($data['budget']);
        }
        if (isset($data['timeline'])) {
            $fields[] = "`timeline` = ?";
            $params[] = is_array($data['timeline']) ? implode(', ', $data['timeline']) : trim($data['timeline']);
        }
        if (isset($data['status'])) {
            $fields[] = "`status` = ?";
            $params[] = $data['status'];
        }
        if (isset($data['notes'])) {
            $fields[] = "`notes` = ?";
            $params[] = trim($data['notes']);
        }
        if (isset($data['answers'])) {
            $fields[] = "`answers_json` = ?";
            $params[] = json_encode($data['answers'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = "`updated_at` = NOW()";
        $params[] = $id;

        $sql = "UPDATE `brief_submissions` SET " . implode(', ', $fields) . " WHERE `id` = ?";
        $stmt = $db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Delete submission
     */
    public static function delete(int $id): bool
    {
        $db = self::db();
        $stmt = $db->prepare("DELETE FROM `brief_submissions` WHERE `id` = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Analytics summary
     */
    public static function getStats(): array
    {
        $db = self::db();

        $total = (int)$db->query("SELECT COUNT(*) FROM `brief_submissions`")->fetchColumn();
        
        $statuses = ['new' => 0, 'in_review' => 0, 'approved' => 0, 'rejected' => 0, 'completed' => 0];
        $statusRows = $db->query("SELECT `status`, COUNT(*) as `cnt` FROM `brief_submissions` GROUP BY `status`")->fetchAll();
        foreach ($statusRows as $row) {
            $statuses[$row['status']] = (int)$row['cnt'];
        }

        $budgetRows = $db->query("SELECT `budget`, COUNT(*) as `cnt` FROM `brief_submissions` WHERE `budget` IS NOT NULL AND `budget` != '' GROUP BY `budget`")->fetchAll();

        $latestDate = $db->query("SELECT MAX(`created_at`) FROM `brief_submissions`")->fetchColumn();

        return [
            'total' => $total,
            'by_status' => $statuses,
            'by_budget' => $budgetRows,
            'latest_submission' => $latestDate ?: null
        ];
    }

    /**
     * Generator for memory-efficient batch streaming of all submissions (e.g. for CSV export)
     */
    public static function cursorAll(): \Generator
    {
        $db = self::db();
        $stmt = $db->query("SELECT * FROM `brief_submissions` ORDER BY `created_at` DESC");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['answers'] = json_decode($row['answers_json'] ?? '{}', true) ?: [];
            yield $row;
        }
    }
}
