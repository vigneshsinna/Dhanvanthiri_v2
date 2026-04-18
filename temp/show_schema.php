<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=animazon', 'root', '');
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "=== Existing Tables ===\n";
foreach ($tables as $t) {
    $stmt = $pdo->query("SHOW CREATE TABLE `$t`");
    $row = $stmt->fetch(PDO::FETCH_NUM);
    echo $row[1] . ";\n\n";
}
