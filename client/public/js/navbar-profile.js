(function () {
  "use strict";

  var dropdownCloseListener = null;

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem('pizzazone_user') || localStorage.getItem('cheezka_user') || 'null');
    } catch (err) {
      return null;
    }
  }

  function closeAllDropdowns() {
    var dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
      dropdown.classList.remove('ck-open');
    }
  }

  function updateNavbarProfile() {
    var user = getLoggedInUser();
    var navMenu = document.getElementById('menu-menu-1');
    if (!navMenu) return;

    var loginItem = null;
    navMenu.querySelectorAll('li.menu-item').forEach(function (li) {
      var a = li.querySelector('a');
      if (a && a.href && a.href.includes('login.html')) {
        loginItem = li;
      }
    });

    if (!loginItem) return;

    if (user && user.email) {
      loginItem.innerHTML =
        '<button id="profile-btn" class="profile-btn ck-nav-cta">' +
        '<i class="fa fa-user-circle ck-mr-6"></i>' +
        '<span id="profile-email">' + escapeHtml(user.email.split('@')[0]) + '</span>' +
        '</button>' +
        '<div id="profile-dropdown" class="profile-dropdown">' +
        '<div class="ck-profile-dd__header">' +
        '<p class="ck-profile-dd__title">Account</p>' +
        '<p class="ck-profile-dd__email">' + escapeHtml(user.email) + '</p>' +
        '</div>' +
        '<a href="profile.html">' +
        '<i class="fa fa-cog ck-mr-6"></i>Profile Settings' +
        '</a>' +
        '<button id="logout-btn">' +
        '<i class="fa fa-sign-out-alt ck-mr-6"></i>Logout' +
        '</button>' +
        '</div>';

      var profileBtn = document.getElementById('profile-btn');
      var profileDropdown = document.getElementById('profile-dropdown');
      var logoutBtn = document.getElementById('logout-btn');

      if (profileBtn) {
        profileBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (!profileDropdown) return;
          profileDropdown.classList.toggle('ck-open');
        });
      }

      if (dropdownCloseListener) {
        document.removeEventListener('click', dropdownCloseListener);
      }

      dropdownCloseListener = function (e) {
        if (profileDropdown && !profileDropdown.contains(e.target) && profileBtn && !profileBtn.contains(e.target)) {
          profileDropdown.classList.remove('ck-open');
        }
      };
      document.addEventListener('click', dropdownCloseListener);

      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          localStorage.removeItem('pizzazone_user');
          localStorage.removeItem('pizzazone_checkout_form');
          localStorage.removeItem('pizzazone_login_form');
          localStorage.removeItem('cheezka_user');
          localStorage.removeItem('cheezka_checkout_form');
          localStorage.removeItem('cheezka_login_form');
          window.location.href = 'login.html';
        });
      }

      loginItem.classList.add('ck-pos-rel');
    } else {
      loginItem.innerHTML =
        '<a href="login.html" class="ck-nav-cta">' +
        '<i class="fa fa-sign-in-alt ck-mr-6"></i>LOGIN' +
        '</a>';
      
      if (dropdownCloseListener) {
        document.removeEventListener('click', dropdownCloseListener);
        dropdownCloseListener = null;
      }
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', updateNavbarProfile);

  window.addEventListener('storage', function (e) {
    if (e.key === 'pizzazone_user' || e.key === 'cheezka_user') {
      updateNavbarProfile();
    }
  });

  window.pizzaZoneCheckLogin = window.cheezkaCheckLogin = function () {
    return getLoggedInUser();
  };
})();
