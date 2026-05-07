<?php

$dir = new RecursiveDirectoryIterator(__DIR__ . '/frontend/src');
$iterator = new RecursiveIteratorIterator($dir);

foreach ($iterator as $file) {
    if ($file->isFile() && ($file->getExtension() === 'tsx' || $file->getExtension() === 'ts')) {
        $content = file_get_contents($file->getPathname());
        if (strpos($content, 'Ã') !== false || strpos($content, 'â') !== false || strpos($content, 'à®') !== false) {
             // Basic detection of corrupted UTF-8 or ISO characters
             echo "Possible encoding issue in: " . $file->getPathname() . "\n";
        }
    }
}
