export const legacyToRoute = {
  'index.html': '/',
  'index_clean.html': '/',
  'shop.html': '/shop',
  'about.html': '/about',
  'contact.html': '/contact',
  'pages.html': '/pages',
  'login.html': '/login',
  'signup.html': '/signup',
  'dashboard.html': '/dashboard',
  'orders.html': '/orders',
};

export function convertLegacyHref(href) {
  if (!href) return href;
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return href;
  }
  if (href.includes('product/') || href.includes('add-to-cart') || href.includes('shop/index.html')) {
    return '/shop';
  }
  const [path, query = ''] = href.split('?');
  if (legacyToRoute[path]) {
    return `${legacyToRoute[path]}${query ? `?${query}` : ''}`;
  }
  return href;
}

export function isLegacyInternalHref(href) {
  if (!href) return false;
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false;
  if (href.includes('product/') || href.includes('add-to-cart') || href.includes('shop/index.html')) return true;
  const [path] = href.split('?');
  return Boolean(legacyToRoute[path]);
}
