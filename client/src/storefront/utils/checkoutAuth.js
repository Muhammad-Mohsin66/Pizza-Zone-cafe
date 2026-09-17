export const RETURN_PATH_KEY = 'pizzazone_auth_return';
export const CHECKOUT_PENDING_KEY = 'pizzazone_checkout_pending';
export const CHECKOUT_AUTH_MESSAGE =
  'Please login or create an account to complete your order.';
export const DEFAULT_CHECKOUT_RETURN = '/shop?checkout=1';

export function saveCheckoutReturnPath(path = DEFAULT_CHECKOUT_RETURN) {
  sessionStorage.setItem(RETURN_PATH_KEY, path);
  sessionStorage.setItem(CHECKOUT_PENDING_KEY, '1');
}

export function getCheckoutReturnPath() {
  return sessionStorage.getItem(RETURN_PATH_KEY) || DEFAULT_CHECKOUT_RETURN;
}

export function clearCheckoutReturnPath() {
  sessionStorage.removeItem(RETURN_PATH_KEY);
  sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
}

export function isCheckoutAuthFlow(searchParams) {
  return (
    searchParams?.get('from') === 'checkout' ||
    sessionStorage.getItem(CHECKOUT_PENDING_KEY) === '1'
  );
}

export function getPostAuthRedirectPath(user) {
  const savedReturn = sessionStorage.getItem(RETURN_PATH_KEY);
  clearCheckoutReturnPath();

  if (savedReturn) {
    return savedReturn;
  }

  // Storefront login always stays on the storefront side.
  // Admin / employee / rider must use /admin to access their panel.
  return '/';
}

/**
 * Post-login redirect specifically for the Admin login page.
 * Directs each staff role to their own panel.
 */
export function getAdminPostAuthRedirectPath(user) {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.role === 'employee') return '/employee/dashboard';
  if (user?.role === 'rider') return '/rider/dashboard';
  return '/admin/dashboard';
}
