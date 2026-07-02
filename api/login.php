<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (isset($USERS[$username]) && hash_equals($USERS[$username]['password'], $password)) {
    $_SESSION['username'] = $username;
    $_SESSION['role'] = $USERS[$username]['role'];
    echo json_encode(['ok' => true, 'role' => $USERS[$username]['role']]);
    exit;
}

http_response_code(401);
echo json_encode(['ok' => false, 'error' => 'Invalid username or password.']);
