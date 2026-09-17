export const CART_STORAGE_KEY = 'pizzazone_cart';

function getLocalJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function getCart() {
  const cart = getLocalJson(CART_STORAGE_KEY, []);
  return Array.isArray(cart) ? cart : [];
}

export function setCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

/**
 * Merge guest cart items into the active cart without losing quantities.
 */
export function mergeCarts(existingCart = [], incomingCart = []) {
  const merged = [...existingCart];

  incomingCart.forEach((incoming) => {
    const match = merged.find(
      (item) =>
        item.name === incoming.name &&
        item.size === incoming.size &&
        item.price === incoming.price
    );

    if (match) {
      match.qty += incoming.qty || 1;
    } else {
      merged.push({ ...incoming });
    }
  });

  return merged;
}

/**
 * Preserve guest cart through login/registration.
 * Cart is stored in localStorage; this ensures it survives auth transitions.
 */
export function preserveGuestCartThroughAuth() {
  const guestCart = getCart();
  if (guestCart.length) {
    setCart(guestCart);
  }
  return guestCart;
}
