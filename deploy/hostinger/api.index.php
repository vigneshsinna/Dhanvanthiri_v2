<?php

declare(strict_types=1);

$backendRoot = getenv('HOSTINGER_BACKEND_ROOT');

if (!is_string($backendRoot) || $backendRoot === '') {
    $backendRoot = __DIR__ . '/../../apps/dhanvanthiri/backend';
}

$backendRoot = realpath($backendRoot);

if ($backendRoot === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Hostinger backend path could not be resolved.';
    exit(1);
}

require $backendRoot . '/vendor/autoload.php';

$app = require_once $backendRoot . '/bootstrap/app.php';

$app->handleRequest(Illuminate\Http\Request::capture());
