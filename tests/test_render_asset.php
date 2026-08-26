<?php
require_once dirname(__DIR__) . '/app/Core/OutputBuffer.php';
use App\Core\OutputBuffer;

$assetFile = dirname(__DIR__) . '/view/assets/index.css';
echo "File: {$assetFile}, size: " . filesize($assetFile) . PHP_EOL;
OutputBuffer::renderCachedFile($assetFile, 'text/css; charset=UTF-8');
