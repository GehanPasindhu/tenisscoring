(function () {
    var listEl = document.getElementById('match-list');
    var userInfo = document.getElementById('user-info');
    var timer = null;

    function render(matches) {
        listEl.innerHTML = '';
        Object.keys(matches).forEach(function (key) {
            var m = matches[key];
            var counts = Api.countSets(m.sets);
            var setsLabel = m.sets && m.sets.length ? '(' + counts.a + ' - ' + counts.b + ')' : '';

            var card = document.createElement('div');
            card.className = 'card match-card';
            card.innerHTML =
                '<h3>' + Api.escapeHtml(m.label) + '</h3>' +
                '<p><span class="status ' + m.status + '">' + m.status.replace(/_/g, ' ') + '</span></p>' +
                '<p>' + Api.escapeHtml(m.team_a) + ' vs ' + Api.escapeHtml(m.team_b) + ' <span class="meta">' + setsLabel + '</span></p>' +
                '<a class="btn" href="match.html?type=' + encodeURIComponent(key) + '">View / Score</a>';
            listEl.appendChild(card);
        });
    }

    function poll() {
        Api.get('api.php').then(render);
    }

    Api.get('api/session.php').then(function (s) {
        if (!s.logged_in || s.role !== 'referee') {
            window.location.href = 'login.html';
            return;
        }
        userInfo.textContent = s.username + ' (' + s.role + ')';
        poll();
        timer = setInterval(poll, 3000);
    });

    document.getElementById('logout-link').addEventListener('click', function (e) {
        e.preventDefault();
        clearInterval(timer);
        Api.post('api/logout.php').then(function () {
            window.location.href = 'login.html';
        });
    });
})();
