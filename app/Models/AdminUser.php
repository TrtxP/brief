<?php
namespace App\Models;

use App\Core\Model;
use PDO;

/**
 * AdminUser Model
 */
class AdminUser extends Model
{
    public static function findByUsername(string $username): ?array
    {
        $db = self::db();
        $stmt = $db->prepare("SELECT * FROM `admin_users` WHERE `username` = ? LIMIT 1");
        $stmt->execute([trim($username)]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function verify(string $username, string $password): ?array
    {
        $user = self::findByUsername($username);
        if (!$user) {
            return null;
        }

        if (password_verify($password, $user['password_hash'])) {
            self::recordLogin((int)$user['id']);
            unset($user['password_hash']);
            return $user;
        }

        return null;
    }

    public static function recordLogin(int $userId): void
    {
        $db = self::db();
        $stmt = $db->prepare("UPDATE `admin_users` SET `last_login` = NOW() WHERE `id` = ?");
        $stmt->execute([$userId]);
    }

    public static function updatePassword(int $userId, string $newPassword): bool
    {
        $db = self::db();
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE `admin_users` SET `password_hash` = ? WHERE `id` = ?");
        return $stmt->execute([$hash, $userId]);
    }
}
