<?php

const SCORE_POINTS = ['0', '15', '30', '40', 'A', 'W'];

function normalize_set(array $set): array
{
    return [
        'team_a'   => (int) ($set['team_a'] ?? 0),
        'team_b'   => (int) ($set['team_b'] ?? 0),
        'tiebreak' => [
            'active' => !empty($set['tiebreak']['active']),
            'team_a' => (int) ($set['tiebreak']['team_a'] ?? 0),
            'team_b' => (int) ($set['tiebreak']['team_b'] ?? 0),
        ],
        'games' => array_values(array_map(static fn ($g) => [
            'team_a' => (string) ($g['team_a'] ?? '0'),
            'team_b' => (string) ($g['team_b'] ?? '0'),
        ], $set['games'] ?? [])),
    ];
}

function apply_match_action(array $match, string $action, array $params): array
{
    $sets = array_map('normalize_set', $match['sets'] ?? []);

    switch ($action) {
        case 'add_set':
            $sets[] = normalize_set(['games' => [['team_a' => '0', 'team_b' => '0']]]);
            break;

        case 'delete_set':
            $si = (int) ($params['set'] ?? -1);
            if (isset($sets[$si])) {
                unset($sets[$si]);
                $sets = array_values($sets);
            }
            break;

        case 'set_score':
            $si = (int) ($params['set'] ?? -1);
            if (isset($sets[$si])) {
                if (isset($params['team_a'])) {
                    $sets[$si]['team_a'] = max(0, (int) $params['team_a']);
                }
                if (isset($params['team_b'])) {
                    $sets[$si]['team_b'] = max(0, (int) $params['team_b']);
                }
            }
            break;

        case 'activate_tiebreak':
            $si = (int) ($params['set'] ?? -1);
            if (isset($sets[$si])) {
                $sets[$si]['tiebreak']['active'] = true;
            }
            break;

        case 'deactivate_tiebreak':
            $si = (int) ($params['set'] ?? -1);
            if (isset($sets[$si])) {
                $sets[$si]['tiebreak'] = ['active' => false, 'team_a' => 0, 'team_b' => 0];
            }
            break;

        case 'tiebreak_inc':
        case 'tiebreak_dec':
            $si = (int) ($params['set'] ?? -1);
            $team = $params['team'] ?? '';
            if (isset($sets[$si]) && in_array($team, ['team_a', 'team_b'], true)) {
                $delta = $action === 'tiebreak_inc' ? 1 : -1;
                $sets[$si]['tiebreak'][$team] = max(0, $sets[$si]['tiebreak'][$team] + $delta);
            }
            break;

        case 'add_game':
            $si = (int) ($params['set'] ?? -1);
            if (isset($sets[$si])) {
                $sets[$si]['games'][] = ['team_a' => '0', 'team_b' => '0'];
            }
            break;

        case 'delete_game':
            $si = (int) ($params['set'] ?? -1);
            $gi = (int) ($params['game'] ?? -1);
            if (isset($sets[$si]['games'][$gi])) {
                unset($sets[$si]['games'][$gi]);
                $sets[$si]['games'] = array_values($sets[$si]['games']);
            }
            break;

        case 'set_point':
            $si = (int) ($params['set'] ?? -1);
            $gi = (int) ($params['game'] ?? -1);
            $team = $params['team'] ?? '';
            $point = $params['point'] ?? '';
            if (isset($sets[$si]['games'][$gi]) && in_array($team, ['team_a', 'team_b'], true) && in_array($point, SCORE_POINTS, true)) {
                $sets[$si]['games'][$gi][$team] = $point;
            }
            break;

        case 'update_meta':
            if (isset($params['team_a'])) {
                $match['team_a'] = trim((string) $params['team_a']);
            }
            if (isset($params['team_b'])) {
                $match['team_b'] = trim((string) $params['team_b']);
            }
            if (isset($params['status']) && in_array($params['status'], ['not_started', 'in_progress', 'completed'], true)) {
                $match['status'] = $params['status'];
            }
            if (isset($params['winner'])) {
                $match['winner'] = trim((string) $params['winner']);
            }
            break;
    }

    $match['sets'] = $sets;

    return $match;
}
