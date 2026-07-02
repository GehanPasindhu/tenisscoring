<?php
session_start();

define('BASE_PATH', __DIR__);
define('DATA_FILE', BASE_PATH . '/data/matches_data.php');

// Hardcoded accounts (no database) - username => [password, role]
$USERS = [
    'referee' => [
        'password' => 'referee123',
        'role'     => 'referee',
    ],
    'umpire' => [
        'password' => 'umpire123',
        'role'     => 'umpire',
    ],
];

// Fixed list of matches for this base version
define('MATCH_TYPES', [
    'mens_doubles'   => "Men's Doubles",
    'womens_doubles' => "Women's Doubles",
    'mixed_doubles'  => "Mixed Doubles",
]);
