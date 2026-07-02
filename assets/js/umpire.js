(function () {
    var mainEl = document.getElementById('main');

    function renderEmpty() {
        mainEl.innerHTML =
            '<div class="u-empty">' +
                '<p class="u-empty-icon">&#127934;</p>' +
                '<h1>No active match</h1>' +
                '<p>Wait for a referee to mark a match as in progress.</p>' +
            '</div>';
    }

    function renderList(activeMatches) {
        var html = '<h1 class="u-heading">Active Matches</h1><div class="u-match-list">';
        Object.keys(activeMatches).forEach(function (key) {
            var m = activeMatches[key];
            html +=
                '<a class="u-match-card" href="match.html?type=' + encodeURIComponent(key) + '">' +
                    '<span class="u-match-label">' + Api.escapeHtml(m.label) + '</span>' +
                    '<span class="u-match-teams">' + Api.escapeHtml(m.team_a) + ' vs ' + Api.escapeHtml(m.team_b) + '</span>' +
                    '<span class="u-match-cta">Score match &rarr;</span>' +
                '</a>';
        });
        html += '</div>';
        mainEl.innerHTML = html;
    }

    function load() {
        Api.get('api.php').then(function (matches) {
            var activeKeys = Object.keys(matches).filter(function (k) {
                return matches[k].status === 'in_progress';
            });

            if (activeKeys.length === 1) {
                window.location.href = 'match.html?type=' + encodeURIComponent(activeKeys[0]);
                return;
            }

            if (activeKeys.length === 0) {
                renderEmpty();
                return;
            }

            var activeMatches = {};
            activeKeys.forEach(function (k) { activeMatches[k] = matches[k]; });
            renderList(activeMatches);
        });
    }

    Api.get('api/session.php').then(function (s) {
        if (!s.logged_in || s.role !== 'umpire') {
            window.location.href = 'login.html';
            return;
        }
        load();
    });

    document.getElementById('logout-link').addEventListener('click', function (e) {
        e.preventDefault();
        Api.post('api/logout.php').then(function () {
            window.location.href = 'login.html';
        });
    });
})();
