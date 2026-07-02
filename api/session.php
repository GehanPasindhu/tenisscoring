<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

echo json_encode([
    'logged_in' => !empty($_SESSION['username']),
    'username'  => $_SESSION['username'] ?? null,
    'role'      => $_SESSION['role'] ?? null,
]);
