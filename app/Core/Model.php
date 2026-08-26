<?php
namespace App\Core;

use PDO;

/**
 * Base Model
 */
abstract class Model
{
    protected static function db(): PDO
    {
        return Database::getConnection();
    }
}
