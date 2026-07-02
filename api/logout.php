<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

$_SESSION = [];
session_destroy();

echo json_encode(['ok' => true]);
