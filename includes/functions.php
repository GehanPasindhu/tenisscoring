<?php

function get_all_matches(): array
{
    return include DATA_FILE;
}

function get_match(string $key): ?array
{
    $matches = get_all_matches();
    return $matches[$key] ?? null;
}

function save_all_matches(array $matches): bool
{
    $export = var_export($matches, true);
    $content = "<?php\n// Match data storage - written to by data functions instead of a database.\nreturn {$export};\n";
    return file_put_contents(DATA_FILE, $content) !== false;
}

function save_match(string $key, array $matchData): bool
{
    $matches = get_all_matches();
    if (!isset($matches[$key])) {
        return false;
    }
    $matchData['updated_by'] = $_SESSION['username'] ?? '';
    $matchData['updated_at'] = date('Y-m-d H:i:s');
    $matches[$key] = $matchData;
    return save_all_matches($matches);
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
