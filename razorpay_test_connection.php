<?php

/**
 * Razorpay Direct Connectivity Test
 */

echo "--- RAZORPAY CONNECTIVITY TEST ---\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

$host = 'api.razorpay.com';
$port = 443;

echo "1. DNS Lookup for $host...\n";
$ip = gethostbyname($host);
if ($ip === $host) {
    echo "DNS FAILED: Could not resolve $host\n";
} else {
    echo "DNS SUCCESS: Resolved to $ip\n";
}

echo "\n2. TCP Connection to $host:$port...\n";
$start = microtime(true);
$fp = @fsockopen($host, $port, $errno, $errstr, 5);
$end = microtime(true);

if (!$fp) {
    echo "TCP FAILED: $errstr ($errno)\n";
} else {
    echo "TCP SUCCESS: Connected in " . round(($end - $start) * 1000, 2) . "ms\n";
    fclose($fp);
}

echo "\n3. HTTPS GET (CURL) to https://$host/v1/orders (should return 401 Unauthorized)...\n";
$ch = curl_init("https://$host/v1/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$start = microtime(true);
$response = curl_exec($ch);
$end = microtime(true);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "CURL FAILED: $error\n";
} else {
    echo "CURL SUCCESS: HTTP Status $httpCode in " . round(($end - $start) * 1000, 2) . "ms\n";
    echo "Note: 401 is expected as we didn't send credentials.\n";
}

echo "\n--- TEST COMPLETE ---\n";
