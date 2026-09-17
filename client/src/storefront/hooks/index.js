import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { convertLegacyHref, isLegacyInternalHref } from '../utils/routes';
import { useAuth } from '../../shared/context/AuthContext';

export function useGlobalStyles() {
  // Stylesheets are loaded statically in client/index.html to prevent FOUC
}

export function useBodyClass(className) {
  useEffect(() => {
    document.body.className = className;
    return () => {
      document.body.className = '';
    };
  }, [className]);
}

export function useLegacyLinkInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const clickHandler = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !isLegacyInternalHref(href)) return;
      event.preventDefault();
      navigate(convertLegacyHref(href));
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [navigate]);
}

export function useScrollTopButton() {
  useEffect(() => {
    const btn = document.getElementById('toTopBtn');
    if (!btn) return;

    const onScroll = () => {
      if (window.scrollY > 400) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    };
    const onClick = (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    btn.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      btn.removeEventListener('click', onClick);
    };
  }, []);
}

export function useHamburgerToggle() {
  useEffect(() => {
    const toggler = document.querySelector('.first-button');
    const icon = document.querySelector('.animated-icon1');
    const nav = document.getElementById('main_nav');
    const navButton = document.querySelector('.nav-button');
    const menuItemsWithChildren = Array.from(document.querySelectorAll('.menu-item-has-children'));
    if (!toggler) return;

    const onToggle = () => {
      if (icon) icon.classList.toggle('open');
      if (nav) nav.classList.toggle('show');
    };
    toggler.addEventListener('click', onToggle);

    const onBeforeUnload = () => {
      if (nav) nav.classList.remove('show');
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const onNavButton = () => {
      document.body.classList.toggle('nav-open');
    };
    const onDropdown = (event) => {
      event.currentTarget.classList.toggle('dropdown');
    };
    navButton?.addEventListener('click', onNavButton);
    menuItemsWithChildren.forEach((item) => item.addEventListener('click', onDropdown));

    return () => {
      toggler.removeEventListener('click', onToggle);
      window.removeEventListener('beforeunload', onBeforeUnload);
      navButton?.removeEventListener('click', onNavButton);
      menuItemsWithChildren.forEach((item) => item.removeEventListener('click', onDropdown));
    };
  }, []);
}

export function useNavLabelNormalization(enabled = true) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;
    const menu = document.getElementById('menu-menu-1');
    if (!menu) return;
    const desired = [
      { text: 'HOME', href: '/' },
      { text: 'MENU', href: '/shop' },
      { text: 'ORDERS', href: '/orders' },
      { text: 'TRACK ORDER', href: '/orders' },
    ];

    const navItems = Array.from(menu.querySelectorAll(':scope > li')).filter((li) => {
      const a = li.querySelector('a');
      if (!a) return false;
      const txt = (a.textContent || '').trim().toUpperCase();
      return txt !== 'LOGIN';
    });

    for (let i = 0; i < desired.length && i < navItems.length; i += 1) {
      const anchor = navItems[i].querySelector('a');
      if (!anchor) continue;
      anchor.textContent = desired[i].text;
      anchor.setAttribute('href', desired[i].href);

      // Dynamically highlight active menu items
      const isHomeActive = desired[i].href === '/' && location.pathname === '/';
      const isOtherActive = desired[i].href !== '/' && location.pathname.startsWith(desired[i].href);
      if (isHomeActive || isOtherActive) {
        anchor.classList.add('ck-nav-active');
        navItems[i].classList.add('current-menu-item');
      } else {
        anchor.classList.remove('ck-nav-active');
        navItems[i].classList.remove('current-menu-item');
      }
    }

    if (navItems.length > desired.length) {
      navItems.slice(desired.length).forEach((li) => li.remove());
    }
  }, [enabled, location.pathname]);
}

export function useNavbarProfile(enabled = true) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!enabled) return;
    const navMenus = document.querySelectorAll('#menu-menu-1');
    if (!navMenus.length) return;

    window.handlePizzaZoneLogout = window.handleCheezkaLogout = async () => {
      await logout();
      navigate('/login');
    };

    const closeHandler = (e) => {
      document.querySelectorAll('.profile-dropdown.ck-open').forEach(dd => {
        if (dd.parentElement && !dd.parentElement.contains(e.target)) {
          dd.classList.remove('ck-open');
        }
      });
    };
    
    document.removeEventListener('click', window._ckCloseHandler);
    window._ckCloseHandler = closeHandler;
    document.addEventListener('click', window._ckCloseHandler);

    navMenus.forEach(navMenu => {
      let loginItem = null;
      navMenu.querySelectorAll('li.menu-item').forEach((li) => {
        const a = li.querySelector('a');
        if (a && a.href && (a.href.includes('login') || a.textContent.toUpperCase() === 'LOGIN' || a.textContent.toUpperCase() === 'ACCOUNT')) {
          loginItem = li;
        }
      });
      if (!loginItem) return;

      if (user && user.email) {
        const avatarUrl = user.avatar || user.profileImage || null;
        const initials = (() => {
          if (!user.name) return '?';
          const parts = user.name.trim().split(/\s+/);
          if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        })();

        const avatarHtml = avatarUrl
          ? `<img src="${avatarUrl}" class="profile-avatar-img" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px;" alt="${user.name}" />`
          : `<div class="profile-avatar-initials" style="width: 32px; height: 32px; border-radius: 50%; background-color: #FF6B35; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 8px;">${initials}</div>`;

        if (!document.getElementById('ck-profile-dropdown-style')) {
          const style = document.createElement('style');
          style.id = 'ck-profile-dropdown-style';
          style.innerHTML = `
            .profile-dropdown {
              position: absolute !important;
              top: 100% !important;
              right: 0 !important;
              margin-top: 10px !important;
              background-color: #fff !important;
              border-radius: 8px !important;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
              min-width: 200px !important;
              opacity: 0 !important;
              visibility: hidden !important;
              transform: translateY(-10px) !important;
              transition: all 0.3s ease !important;
              z-index: 999999 !important;
              display: block !important;
            }
            .profile-dropdown.ck-open {
              opacity: 1 !important;
              visibility: visible !important;
              transform: translateY(0) !important;
            }
            .ck-profile-dd__header {
              padding: 15px 20px !important;
              border-bottom: 1px solid #eee !important;
              text-align: left !important;
            }
            .ck-profile-dd__title {
              margin: 0 !important;
              font-weight: bold !important;
              color: #333 !important;
              font-size: 16px !important;
              line-height: 1.2 !important;
            }
            .ck-profile-dd__email {
              margin: 5px 0 0 !important;
              font-size: 13px !important;
              color: #777 !important;
              line-height: 1.2 !important;
            }
            .profile-dropdown a, 
            .profile-dropdown button {
              display: block !important;
              padding: 12px 20px !important;
              color: #555 !important;
              text-decoration: none !important;
              background: none !important;
              border: none !important;
              width: 100% !important;
              text-align: left !important;
              cursor: pointer !important;
              font-size: 14px !important;
              transition: background 0.2s !important;
              font-family: inherit !important;
            }
            .profile-dropdown a:hover, 
            .profile-dropdown button:hover {
              background-color: #f9f9f9 !important;
              color: #FF6B35 !important;
            }
          `;
          document.head.appendChild(style);
        }

        loginItem.innerHTML =
          `<div style="display: flex; align-items: center; gap: 16px; position: relative;">` +
          `<div id="navbar-bell-container"></div>` +
          `<div style="position: relative; display: inline-block;">` +
          `<button class="profile-btn ck-nav-cta" onclick="event.preventDefault(); event.stopPropagation(); const dd = this.nextElementSibling; if(dd) { document.querySelectorAll('.profile-dropdown').forEach(d => { if(d !== dd) d.classList.remove('ck-open'); }); dd.classList.toggle('ck-open'); }" style="display: flex; align-items: center; background: none; border: none; padding: 0; cursor: pointer;">` +
          avatarHtml +
          `<span style="margin-left: 4px;">${(user.name || user.email.split('@')[0]).replace(/[<>&"']/g, '')}</span>` +
          `</button>` +
          `<div class="profile-dropdown">` +
          `<div class="ck-profile-dd__header">` +
          `<p class="ck-profile-dd__title">${(user.name || 'Account').replace(/[<>&"']/g, '')}</p>` +
          `<p class="ck-profile-dd__email">${(user.email || '').replace(/[<>&"']/g, '')}</p>` +
          `</div>` +
          `<a href="/dashboard"><i class="fa fa-user ck-mr-6"></i>My Profile</a>` +
          `<a href="/orders"><i class="fa fa-shopping-bag ck-mr-6"></i>My Orders</a>` +
          `<button onclick="event.preventDefault(); window.handlePizzaZoneLogout();" class="ck-logout-btn"><i class="fa fa-sign-out-alt ck-mr-6"></i>Logout</button>` +
          `</div>` +
          `</div>` +
          `</div>`;

        loginItem.classList.add('ck-pos-rel');
      } else {
        loginItem.innerHTML =
          `<a href="/login" class="ck-nav-cta"><i class="fa fa-sign-in-alt ck-mr-6"></i>LOGIN</a>`;
        loginItem.classList.remove('ck-pos-rel');
      }
    });

    return () => {
      document.removeEventListener('click', window._ckCloseHandler);
    };
  }, [enabled, location.pathname, navigate, user, isAuthenticated, logout]);
}

export function usePreventRefreshMonitor() {
  useEffect(() => {
    let lastPageLoadTime = Date.now();
    let pageLoadCount = 0;
    const originalSetInterval = window.setInterval;
    let suspiciousIntervalCount = 0;

    const visibilityHandler = () => {
      if (!document.hidden) {
        const timeSinceLastLoad = Date.now() - lastPageLoadTime;
        if (timeSinceLastLoad < 3000) {
          pageLoadCount += 1;
          if (pageLoadCount > 2) {
            console.warn('Detected rapid page reloads! This might indicate an auto-refresh loop.');
            pageLoadCount = 0;
          }
        } else {
          pageLoadCount = 0;
        }
        lastPageLoadTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    window.setInterval = function (callback, delay) {
      if (delay && delay < 1000 && delay > 0) {
        suspiciousIntervalCount += 1;
        if (suspiciousIntervalCount <= 3) {
          console.warn('Interval detected:', delay, 'ms. Stack:', new Error().stack.split('\n')[2]);
        }
      }
      return originalSetInterval.apply(this, arguments);
    };

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.setInterval = originalSetInterval;
    };
  }, []);
}
