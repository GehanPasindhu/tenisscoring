(function () {
    var POINTS = ['0', '15', '30', '40', 'A', 'W'];
    var app = document.getElementById('app');
    var params = new URLSearchParams(window.location.search);
    var type = params.get('type') || '';
    var role = null;
    var match = null;
    var busy = false;
    var syncTimer = null;

    function esc(v) { return Api.escapeHtml(v); }

    function statusLabel(s) { return s.replace(/_/g, ' '); }

    // ---------- Umpire (mobile scorer) ----------

    function renderUmpirePage() {
        var counts = Api.countSets(match.sets);
        app.innerHTML =
            '<main class="u-score-page">' +
                '<header class="u-score-header">' +
                    '<a class="u-back-btn" href="umpire.html">&larr; Back</a>' +
                    '<div class="u-score-header-right">' +
                        '<span class="u-court">COURT 1</span>' +
                        '<span class="u-panel-label">UMPIRE PANEL</span>' +
                    '</div>' +
                '</header>' +
                '<div class="u-match-pill">' +
                    '<span class="u-match-type">' + esc((match.label || '').toUpperCase()) + '</span>' +
                    '<div class="u-match-vs">' +
                        '<span class="u-team-name">' + esc(match.team_a) + ' - <span id="tally-a">' + counts.a + '</span></span>' +
                        '<span class="u-vs">vs</span>' +
                        '<span class="u-team-name">' + esc(match.team_b) + ' - <span id="tally-b">' + counts.b + '</span></span>' +
                    '</div>' +
                '</div>' +
                '<div id="error-box"></div>' +
                '<form id="score-form" onsubmit="return false;">' +
                    '<div id="sets-container">' + renderSetsHtml() + '</div>' +
                '</form>' +
            '</main>';

        wireUmpireEvents();
        startSync();
    }

    function renderSetsHtml() {
        var html =
            '<div class="u-sets-heading">' +
                '<h3>Match Sets</h3>' +
                '<button type="button" data-action="add_set" class="u-pill-btn u-pill-orange">+ Add Set</button>' +
            '</div>';

        match.sets.forEach(function (set, si) {
            html += '<div class="u-set-block">';
            html +=
                '<div class="u-set-block-head">' +
                    '<span class="u-set-badge-wrap"><span class="u-set-label">SET</span><span class="u-set-num">' + (si + 1) + '</span></span>' +
                    '<span class="u-set-score"><span class="u-score-badge">' + set.team_a + '</span><span class="u-vs-small">vs</span><span class="u-score-badge">' + set.team_b + '</span></span>' +
                    '<button type="button" data-action="delete_set" data-set="' + si + '" class="u-icon-btn" title="Delete set">&#128465;</button>' +
                '</div>';

            if (set.tiebreak.active) {
                var tbA = set.tiebreak.team_a, tbB = set.tiebreak.team_b, winner = '';
                if (tbA >= 7 && tbA - tbB >= 2) winner = 'T1 WINS';
                else if (tbB >= 7 && tbB - tbA >= 2) winner = 'T2 WINS';

                html +=
                    '<div class="u-tiebreak-box u-tiebreak-active">' +
                        '<div class="u-tiebreak-head">' +
                            '<span class="u-tiebreak-label">TIEBREAK (' + tbA + ' &ndash; ' + tbB + ')</span>' +
                            (winner ? '<span class="u-tiebreak-winner">' + winner + '</span>' : '') +
                            '<button type="button" data-action="deactivate_tiebreak" data-set="' + si + '" class="u-icon-btn u-icon-btn-close u-tiebreak-close" title="Close tiebreak">&times;</button>' +
                        '</div>' +
                        '<div class="u-tiebreak-stepper">' +
                            '<span class="u-tiebreak-team">' + esc(match.team_a) + '</span>' +
                            '<button type="button" data-action="tiebreak_dec" data-set="' + si + '" data-team="team_a" class="u-step-btn">&minus;</button>' +
                            '<span class="u-step-value u-step-value-a">' + tbA + '</span>' +
                            '<button type="button" data-action="tiebreak_inc" data-set="' + si + '" data-team="team_a" class="u-step-btn">+</button>' +
                        '</div>' +
                        '<div class="u-tiebreak-stepper">' +
                            '<span class="u-tiebreak-team">' + esc(match.team_b) + '</span>' +
                            '<button type="button" data-action="tiebreak_dec" data-set="' + si + '" data-team="team_b" class="u-step-btn">&minus;</button>' +
                            '<span class="u-step-value u-step-value-b">' + tbB + '</span>' +
                            '<button type="button" data-action="tiebreak_inc" data-set="' + si + '" data-team="team_b" class="u-step-btn">+</button>' +
                        '</div>' +
                    '</div>';
            } else {
                html +=
                    '<div class="u-tiebreak-box">' +
                        '<span class="u-tiebreak-label">TIEBREAK (' + set.team_a + ' - ' + set.team_b + ')</span>' +
                        '<button type="button" data-action="activate_tiebreak" data-set="' + si + '" class="u-pill-btn u-pill-blue">Activate</button>' +
                    '</div>';
            }

            html += '<button type="button" data-action="add_game" data-set="' + si + '" class="u-add-game">+ ADD GAME</button>';

            set.games.forEach(function (game, gi) {
                html += '<div class="u-game-card">';
                html +=
                    '<div class="u-game-card-head">' +
                        '<span>GAME ' + (gi + 1) + '</span>' +
                        '<button type="button" data-action="delete_game" data-set="' + si + '" data-game="' + gi + '" class="u-icon-btn u-icon-btn-close" title="Remove game">&times;</button>' +
                    '</div>';

                ['team_a', 'team_b'].forEach(function (team) {
                    html += '<div class="u-game-team"><span class="u-game-team-name">' + esc(match[team]) + '</span><div class="u-point-row">';
                    POINTS.forEach(function (p) {
                        var selected = game[team] === p ? ' u-point-selected' : '';
                        html += '<button type="button" data-action="set_point" data-set="' + si + '" data-game="' + gi + '" data-team="' + team + '" data-point="' + p + '" class="u-point-opt' + selected + '">' + p + '</button>';
                    });
                    html += '</div></div>';
                });

                html += '</div>';
            });

            html += '</div>';
        });

        return html;
    }

    function wireUmpireEvents() {
        var container = document.getElementById('sets-container');

        container.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-action]');
            if (!btn) return;

            if (btn.dataset.action === 'set_point') {
                var row = btn.closest('.u-point-row');
                if (row) {
                    row.querySelectorAll('.u-point-opt').forEach(function (opt) {
                        opt.classList.remove('u-point-selected');
                    });
                    btn.classList.add('u-point-selected');
                }
            }

            btn.classList.add('u-pressed');
            runAction(btn.dataset);
        });
    }

    function runAction(dataset) {
        busy = true;
        var action = dataset.action;
        var actionParams = {};
        if (dataset.set !== undefined) actionParams.set = dataset.set;
        if (dataset.game !== undefined) actionParams.game = dataset.game;
        if (dataset.team !== undefined) actionParams.team = dataset.team;
        if (dataset.point !== undefined) actionParams.point = dataset.point;

        Api.post('api/match.php', { type: type, action: action, params: actionParams })
            .then(function (data) {
                var errorBox = document.getElementById('error-box');
                if (!data.ok) {
                    errorBox.innerHTML = '<p class="error">' + esc(data.error || 'Could not save.') + '</p>';
                    return;
                }
                errorBox.innerHTML = '';
                match = data.match;
                document.getElementById('sets-container').innerHTML = renderSetsHtml();
                var counts = Api.countSets(match.sets);
                document.getElementById('tally-a').textContent = counts.a;
                document.getElementById('tally-b').textContent = counts.b;
            })
            .catch(function () {})
            .finally(function () { busy = false; });
    }

    function startSync() {
        syncTimer = setInterval(function () {
            if (busy) return;
            Api.get('api.php?type=' + encodeURIComponent(type)).then(function (fresh) {
                if (busy || !fresh || fresh.error) return;
                if (fresh.updated_at && fresh.updated_at !== match.updated_at) {
                    match = fresh;
                    document.getElementById('sets-container').innerHTML = renderSetsHtml();
                    var counts = Api.countSets(match.sets);
                    document.getElementById('tally-a').textContent = counts.a;
                    document.getElementById('tally-b').textContent = counts.b;
                }
            }).catch(function () {});
        }, 4000);
    }

    // ---------- Referee (simple editor) ----------

    function renderRefereePage() {
        app.innerHTML =
            '<div class="topbar">' +
                '<h2>Tennis Scoring</h2>' +
                '<div><span class="meta" id="user-info"></span> | <a href="#" id="logout-link">Logout</a></div>' +
            '</div>' +
            '<main class="u-score-page">' +
                '<a class="u-back" href="dashboard.html">&larr; Back to matches</a>' +
                '<div class="u-score-card">' +
                    '<h1 style="margin-top:0;">' + esc(match.label) + '</h1>' +
                    '<p><span class="status ' + match.status + '" id="status-badge">' + statusLabel(match.status) + '</span></p>' +
                    '<div id="error-box"></div>' +

                    '<label for="team_a">Team A</label>' +
                    '<input type="text" id="team_a" value="' + esc(match.team_a) + '">' +

                    '<label for="team_b">Team B</label>' +
                    '<input type="text" id="team_b" value="' + esc(match.team_b) + '">' +

                    '<h3>Sets</h3>' +
                    '<div id="sets-editor"></div>' +
                    '<button type="button" id="add-set-btn" class="u-pill-btn u-pill-orange" style="margin-bottom:14px;">+ Add Set</button>' +

                    '<label for="status">Status</label>' +
                    '<select id="status">' +
                        '<option value="not_started">Not Started</option>' +
                        '<option value="in_progress">In Progress</option>' +
                        '<option value="completed">Completed</option>' +
                    '</select>' +

                    '<label for="winner">Winner (optional)</label>' +
                    '<input type="text" id="winner" value="' + esc(match.winner) + '" placeholder="e.g. Team A">' +

                    '<button type="button" id="save-btn" class="u-btn u-btn-primary" style="margin-top:10px;">Save Match</button>' +
                '</div>' +
            '</main>';

        document.getElementById('status').value = match.status;
        renderSetsEditor();

        document.getElementById('add-set-btn').addEventListener('click', function () {
            runRefereeAction('add_set', {}).then(renderRefereePage);
        });

        document.getElementById('save-btn').addEventListener('click', saveRefereeMeta);

        document.getElementById('logout-link').addEventListener('click', function (e) {
            e.preventDefault();
            Api.post('api/logout.php').then(function () { window.location.href = 'login.html'; });
        });

        Api.get('api/session.php').then(function (s) {
            document.getElementById('user-info').textContent = s.username + ' (' + s.role + ')';
        });
    }

    function renderSetsEditor() {
        var el = document.getElementById('sets-editor');
        var html = '';
        match.sets.forEach(function (set, si) {
            html +=
                '<div class="u-set-editors" style="margin-bottom:8px;">' +
                    '<label>Set ' + (si + 1) + ' - ' + esc(match.team_a) + '<input type="number" min="0" data-set="' + si + '" data-team="team_a" class="set-score-input" value="' + set.team_a + '"></label>' +
                    '<label>Set ' + (si + 1) + ' - ' + esc(match.team_b) + '<input type="number" min="0" data-set="' + si + '" data-team="team_b" class="set-score-input" value="' + set.team_b + '"></label>' +
                '</div>';
        });
        el.innerHTML = html;

        el.querySelectorAll('.set-score-input').forEach(function (input) {
            input.addEventListener('change', function () {
                var actionParams = { set: input.dataset.set };
                actionParams[input.dataset.team] = input.value;
                runRefereeAction('set_score', actionParams);
            });
        });
    }

    function saveRefereeMeta() {
        runRefereeAction('update_meta', {
            team_a: document.getElementById('team_a').value,
            team_b: document.getElementById('team_b').value,
            status: document.getElementById('status').value,
            winner: document.getElementById('winner').value,
        }).then(function () {
            renderRefereePage();
        });
    }

    function runRefereeAction(action, actionParams) {
        return Api.post('api/match.php', { type: type, action: action, params: actionParams }).then(function (data) {
            var errorBox = document.getElementById('error-box');
            if (!data.ok) {
                errorBox.innerHTML = '<p class="error">' + esc(data.error || 'Could not save.') + '</p>';
                return;
            }
            errorBox.innerHTML = '';
            match = data.match;
        });
    }

    // ---------- Boot ----------

    Api.get('api/session.php').then(function (s) {
        if (!s.logged_in) {
            window.location.href = 'login.html';
            return;
        }
        role = s.role;

        Api.get('api.php?type=' + encodeURIComponent(type)).then(function (data) {
            if (!data || data.error) {
                window.location.href = role === 'umpire' ? 'umpire.html' : 'dashboard.html';
                return;
            }
            match = data;
            if (role === 'umpire') {
                renderUmpirePage();
            } else {
                renderRefereePage();
            }
        });
    });
})();
