(function () {
    var form = document.getElementById('login-form');
    var errorEl = document.getElementById('error');

    function goToRolePage(role) {
        window.location.href = role === 'umpire' ? 'umpire.html' : 'dashboard.html';
    }

    Api.get('api/session.php').then(function (s) {
        if (s.logged_in) {
            goToRolePage(s.role);
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        errorEl.style.display = 'none';

        Api.post('api/login.php', {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
        }).then(function (data) {
            if (data.ok) {
                goToRolePage(data.role);
            } else {
                errorEl.textContent = data.error || 'Invalid username or password.';
                errorEl.style.display = 'block';
            }
        });
    });
})();
