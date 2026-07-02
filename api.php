<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

// Read-only JSON feed of live scores. No login required — scores are not
// sensitive and this powers the public scoreboard plus in-page polling.
header('Content-Type: application/json');

$type = $_GET['type'] ?? '';

if ($type !== '') {
    $match = get_match($type);
    if (!$match) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        exit;
    }
    echo json_encode($match);
    exit;
}

echo json_encode(get_all_matches());
