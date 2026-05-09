<?php
/**
 * DEBUG: Browse Button Fix Verification
 * Upload this file to your Hostinger public_html root and open:
 *   https://dhanvanthrifoods.com/debug_browse_fix.php
 *
 * DELETE this file after testing is complete.
 */

// --- Helpers ---
function testUrl(string $label, string $method, string $url, array $postData = []): array
{
    $ch = curl_init();
    $opts = [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => false,
    ];

    if ($method === 'POST') {
        $opts[CURLOPT_POST]       = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($postData);
    }

    curl_setopt_array($ch, $opts);
    $raw     = curl_exec($ch);
    $info    = curl_getinfo($ch);
    $errno   = curl_errno($ch);
    $errmsg  = curl_error($ch);
    curl_close($ch);

    $headerSize = $info['header_size'];
    $headers    = substr($raw, 0, $headerSize);
    $body       = substr($raw, $headerSize);

    $contentType = '';
    foreach (explode("\r\n", $headers) as $line) {
        if (stripos($line, 'Content-Type:') === 0) {
            $contentType = trim(substr($line, strlen('Content-Type:')));
        }
    }

    $isJson = (json_decode($body) !== null && json_last_error() === JSON_ERROR_NONE);
    $isHtml = (strpos(strtolower(trim($body)), '<!doctype') === 0 || strpos(strtolower(trim($body)), '<html') === 0);
    $is404  = ($info['http_code'] === 404) || (strpos($body, '404') !== false && $isHtml);

    return [
        'label'        => $label,
        'url'          => $url,
        'method'       => $method,
        'status'       => $errno ? "CURL ERROR: $errmsg" : $info['http_code'],
        'content_type' => $contentType,
        'is_json'      => $isJson,
        'is_html'      => $isHtml,
        'is_404'       => $is404,
        'body_preview' => substr($body, 0, 300),
        'pass'         => !$is404 && ($info['http_code'] < 400) && ($isJson || strpos($body, 'aizUploaderModal') !== false),
    ];
}

function badge(bool $ok): string
{
    return $ok
        ? '<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold">PASS</span>'
        : '<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold">FAIL</span>';
}

$base = rtrim((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'], '/');

$csrfToken = '';

// Try to get a CSRF token first
$csrfRaw = @file_get_contents($base . '/refresh-csrf');
if ($csrfRaw) {
    $csrfToken = trim($csrfRaw, '"');
}

$tests = [];

// Test 1: GET /aiz-uploader/get-uploaded-files (OLD aiz-core.js path used by deployed version)
$tests[] = testUrl(
    'GET /aiz-uploader/get-uploaded-files (used by old deployed aiz-core.js)',
    'GET',
    $base . '/aiz-uploader/get-uploaded-files?sort=newest'
);

// Test 2: POST /aiz-uploader (modal HTML loader, OLD aiz-core.js path)
$t2 = testUrl(
    'POST /aiz-uploader (modal HTML, old aiz-core.js path)',
    'POST',
    $base . '/aiz-uploader',
    ['_token' => $csrfToken]
);
// Override pass logic: this should return HTML with the modal, not a 404
$t2['pass'] = !$t2['is_404'] && (strpos($t2['body_preview'], 'aizUploaderModal') !== false || $t2['status'] == 419 || $t2['status'] == 302);
$tests[] = $t2;

// Test 3: GET /admin/aiz-uploader/get-uploaded-files (NEW aiz-core.js path, admin pages)
$tests[] = testUrl(
    'GET /admin/aiz-uploader/get-uploaded-files (new aiz-core.js on admin pages)',
    'GET',
    $base . '/admin/aiz-uploader/get-uploaded-files?sort=newest'
);

// Test 4: POST /admin/aiz-uploader (modal HTML loader, NEW aiz-core.js path)
$t4 = testUrl(
    'POST /admin/aiz-uploader (modal HTML, new aiz-core.js path)',
    'POST',
    $base . '/admin/aiz-uploader',
    ['_token' => $csrfToken]
);
$t4['pass'] = !$t4['is_404'] && (strpos($t4['body_preview'], 'aizUploaderModal') !== false || $t4['status'] == 419 || $t4['status'] == 302);
$tests[] = $t4;

// Test 5: Sanity — admin dashboard should still route to Laravel
$t5 = testUrl('GET /admin (sanity: admin still routes to Laravel)', 'GET', $base . '/admin');
$t5['pass'] = !$t5['is_404'] && ($t5['status'] == 200 || $t5['status'] == 302);
$tests[] = $t5;

// Test 6: Storefront homepage should still serve React SPA
$t6 = testUrl('GET / (sanity: storefront still serves React SPA)', 'GET', $base . '/');
$t6['pass'] = strpos($t6['body_preview'], '<!doctype') !== false && strpos($t6['body_preview'], '404') === false;
$tests[] = $t6;

$allPass = array_reduce($tests, fn($carry, $t) => $carry && $t['pass'], true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Browse Fix Debug</title>
    <style>
        body { font-family: monospace; background: #f1f5f9; padding: 20px; }
        h1   { font-size: 1.4rem; margin-bottom: 4px; }
        .overall { padding: 12px 20px; border-radius: 6px; font-size: 1.1rem; margin-bottom: 24px; font-weight: bold; }
        .overall.ok  { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .overall.fail{ background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px #0001; }
        th    { background: #1e293b; color: #f8fafc; padding: 8px 12px; text-align: left; font-size: .8rem; }
        td    { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: .8rem; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        .pre  { white-space: pre-wrap; word-break: break-all; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 4px; max-height: 100px; overflow: auto; }
        .warn { color: #b45309; }
        h2    { margin-top: 28px; font-size: 1rem; color: #475569; }
    </style>
</head>
<body>
<h1>🔍 Browse Button Fix — Live Verification</h1>
<p style="color:#64748b;margin-bottom:16px">Tests whether <code>/aiz-uploader</code> routes now reach Laravel instead of the React 404 page.</p>

<div class="overall <?= $allPass ? 'ok' : 'fail' ?>">
    <?= $allPass ? '✅ All tests passed — the fix is working correctly.' : '❌ One or more tests failed — see details below.' ?>
</div>

<table>
    <thead>
        <tr>
            <th>Result</th>
            <th>Test</th>
            <th>HTTP Status</th>
            <th>Content-Type</th>
            <th>JSON?</th>
            <th>HTML 404?</th>
            <th>Body Preview</th>
        </tr>
    </thead>
    <tbody>
    <?php foreach ($tests as $t): ?>
        <tr>
            <td><?= badge($t['pass']) ?></td>
            <td><?= htmlspecialchars($t['label']) ?><br><small style="color:#64748b"><?= $t['method'] ?> <?= htmlspecialchars($t['url']) ?></small></td>
            <td><?= htmlspecialchars((string)$t['status']) ?></td>
            <td><?= htmlspecialchars($t['content_type'] ?: '—') ?></td>
            <td><?= $t['is_json'] ? '✅ Yes' : '—' ?></td>
            <td><?= $t['is_404'] ? '<span class="warn">⚠️ Yes</span>' : '—' ?></td>
            <td><div class="pre"><?= htmlspecialchars($t['body_preview']) ?></div></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>

<h2>Expected Results After Fix</h2>
<ul style="font-size:.85rem;color:#475569">
    <li><strong>Tests 1 &amp; 2 (old path <code>/aiz-uploader</code>)</strong>: Should return <em>JSON paginated data</em> (test 1) and <em>modal HTML</em> (test 2). If still 404 HTML → htaccess not yet updated on server.</li>
    <li><strong>Tests 3 &amp; 4 (new path <code>/admin/aiz-uploader</code>)</strong>: May return 302 (redirect to login) or 419 (CSRF) when not authenticated — that is <em>correct</em> behaviour (route is reaching Laravel). Only 404 HTML is a failure.</li>
    <li><strong>Tests 5 &amp; 6</strong>: Sanity checks — admin and storefront should be unaffected.</li>
</ul>

<p style="margin-top:24px;color:#94a3b8;font-size:.75rem">⚠️ Delete this file from your server after testing.</p>
</body>
</html>
