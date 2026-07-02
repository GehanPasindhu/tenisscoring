window.Api = {
    get: function (url) {
        return fetch(url, { headers: { 'X-Requested-With': 'fetch' } }).then(function (res) {
            return res.json();
        });
    },

    post: function (url, body) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
            body: JSON.stringify(body || {}),
        }).then(function (res) {
            return res.json();
        });
    },

    escapeHtml: function (str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    },

    countSets: function (sets) {
        var a = 0, b = 0;
        (sets || []).forEach(function (s) {
            if (s.team_a > s.team_b) a++;
            else if (s.team_b > s.team_a) b++;
        });
        return { a: a, b: b };
    },
};
