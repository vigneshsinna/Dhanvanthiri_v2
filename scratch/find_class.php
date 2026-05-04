<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

$rc = new ReflectionClass('CoreComponentRepository');
echo $rc->getFileName();
