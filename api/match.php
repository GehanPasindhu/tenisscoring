<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/match_actions.php';

header('Content-Type: application/json');

if (empty($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not logged in.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$type = $input['type'] ?? '';
$action = $input['action'] ?? '';
$params = $input['params'] ?? [];

if (!array_key_exists($type, MATCH_TYPES)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Unknown match.']);
    exit;
}

$match = get_match($type);
$match = apply_match_action($match, $action, is_array($params) ? $params : []);

if (save_match($type, $match)) {
    echo json_encode(['ok' => true, 'match' => get_match($type)]);
    exit;
}

http_response_code(500);
echo json_encode(['ok' => false, 'error' => 'Could not save match data.']);
