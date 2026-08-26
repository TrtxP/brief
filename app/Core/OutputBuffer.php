<?php
namespace App\Core;

/**
 * OutputBuffer Manager
 * Implements response buffering, memory conservation, GZIP compression, and ETag caching
 */
class OutputBuffer
{
    private static bool $started = false;
    private static array $config = [];

    public static function init(array $config = []): void
    {
        self::$config = $config;
        if (!self::$started) {
            // Start output buffering
            if (!empty($config['enable_gzip']) && extension_loaded('zlib') && !ob_get_level()) {
                // Check if browser accepts gzip
                if (isset($_SERVER['HTTP_ACCEPT_ENCODING']) && str_contains($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip')) {
                    ob_start('ob_gzhandler');
                } else {
                    ob_start();
                }
            } else {
                ob_start();
            }
            self::$started = true;
        }
    }

    /**
     * Efficiently streams or renders a file with memory-saving chunks and ETag cache
     */
    public static function renderCachedFile(string $filePath, string $contentType = 'text/html; charset=UTF-8'): void
    {
        if (!file_exists($filePath)) {
            http_response_code(404);
            echo "File not found.";
            return;
        }

        $lastModified = filemtime($filePath);
        $etag = sprintf('"%x-%x"', $lastModified, filesize($filePath));

        header("Content-Type: {$contentType}");
        header("Last-Modified: " . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
        header("ETag: {$etag}");

        // Client cache validation (304 Not Modified)
        if (
            (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
            (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && @strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) === $lastModified)
        ) {
            http_response_code(304);
            exit;
        }

        // Cache-control for static view/assets
        header("Cache-Control: public, max-age=3600, must-revalidate");
        header("Content-Length: " . filesize($filePath));

        // Clear any previous output buffer to avoid corruption
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        readfile($filePath);
        exit;
    }

    /**
     * Flush and end buffering cleanly
     */
    public static function flush(): void
    {
        if (self::$started && ob_get_level() > 0) {
            ob_end_flush();
            self::$started = false;
        }
    }
}
