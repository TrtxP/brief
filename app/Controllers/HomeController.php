<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Core\OutputBuffer;

/**
 * Frontend SPA Entry Controller
 * Serves compiled React SPA from view/
 */
class HomeController extends Controller
{
    public function index(): void
    {
        $viewDir = dirname(__DIR__, 2) . '/view';
        $indexPath = $viewDir . '/index.html';

        if (file_exists($indexPath)) {
            OutputBuffer::renderCachedFile($indexPath, 'text/html; charset=UTF-8');
            return;
        }

        // If frontend has not been compiled yet, render developer guide
        header('Content-Type: text/html; charset=UTF-8');
        ?>
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Структурований бриф — Очікування компіляції</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .card {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 600px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                }
                h1 { color: #38bdf8; margin-top: 0; font-size: 24px; }
                p { color: #94a3b8; line-height: 1.6; }
                code {
                    background: #0f172a;
                    color: #38bdf8;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .status-badge {
                    display: inline-block;
                    background: #0284c7;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .btn {
                    display: inline-block;
                    background: #2563eb;
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <span class="status-badge">Бекенд PHP MVC активний</span>
                <h1>Структурований бриф інтернет-магазину риболовлі</h1>
                <p>Бекенд на чистому PHP працює належним чином. Фронтенд-частину на React + Vite потрібно скомпілювати у папку <code>view/</code> або запустити для розробки:</p>
                <p><strong>Для розробки фронтенду:</strong><br>
                <code>cd frontend && npm run dev</code> &rarr; <code>http://localhost:5173</code></p>
                <p><strong>Для збірки у папку view/:</strong><br>
                <code>cd frontend && npm run build</code></p>
                <a href="api/brief/status/test" class="btn">Перевірити API бекенду</a>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}
