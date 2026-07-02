(function () {
    var mainEl = document.getElementById('main');

    function render(matches) {
        var html = '<div class="u-match-list">';
        Object.keys(matches).forEach(function (key) {
            var m = matches[key];
            var counts = Api.countSets(m.sets);
            html +=
                '<div class="u-match-card u-scoreboard-card">' +
                    '<span class="u-match-label">' + Api.escapeHtml(m.label) + '</span>' +
                    '<div class="u-scoreboard-teams">' +
                        '<span>' + Api.escapeHtml(m.team_a) + '</span>' +
                        '<span class="u-scoreboard-sets">' + counts.a + ' - ' + counts.b + '</span>' +
                        '<span>' + Api.escapeHtml(m.team_b) + '</span>' +
                    '</div>' +
                    '<span class="status ' + m.status + '">' + m.status.replace(/_/g, ' ') + '</span>' +
                '</div>';
        });
        html += '</div>';
        mainEl.innerHTML = html;
    }

    function poll() {
        Api.get('api.php').then(render);
    }

    poll();
    setInterval(poll, 3000);
})();
