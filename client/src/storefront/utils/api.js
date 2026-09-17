const getDynamicApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  if (isIp) {
    return `${protocol}//${hostname}:5001/api`;
  }
  return '/api';
};

const API_BASE = getDynamicApiBase();
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.detail || `HTTP error! status: ${response.status}`);
  }
  return data;
}

function getAuthHeaders() {
  const headers = { 
    'Content-Type': 'application/json',
    'X-Session-Type': 'customer' 
  };
  const token = localStorage.getItem('customerToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getFetchOptions(options = {}) {
  return {
    ...options,
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };
}

export const endpoints = {
  API_ROOT,
  API_BASE,
  HEALTH: `${API_BASE}/health`,
  ORDERS_CREATE: `${API_BASE}/orders`,
  ORDERS_LIST: `${API_BASE}/orders/my-orders/list`,
  orderStatus: (orderId) => `${API_BASE}/orders/${encodeURIComponent(orderId)}/status`,
};

export async function checkHealth() {
  const response = await fetch(endpoints.HEALTH);
  return parseJson(response);
}

export async function listOrders() {
  const response = await fetch(endpoints.ORDERS_LIST, getFetchOptions());
  return parseJson(response);
}

export async function updateOrderStatus(orderId, status) {
  const response = await fetch(endpoints.orderStatus(orderId), getFetchOptions({
    method: 'PATCH',
    body: JSON.stringify({ orderStatus: status }),
  }));
  return parseJson(response);
}

export async function createOrder(payload) {
  const response = await fetch(endpoints.ORDERS_CREATE, getFetchOptions({
    method: 'POST',
    body: JSON.stringify(payload),
  }));
  return parseJson(response);
}

export async function getOrderDetails(orderId) {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/details`, getFetchOptions());
  return parseJson(response);
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getProducts() {
  const response = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getDeals() {
  const response = await fetch(`${API_BASE}/deals`, { cache: 'no-store' });
  return parseJson(response);
}

export async function getBankAccounts() {
  const response = await fetch(`${API_BASE}/bank-accounts`, { cache: 'no-store' });
  return parseJson(response);
}

export async function requestRefund(orderId, reason) {
  const response = await fetch(`${API_BASE}/refunds/request`, getFetchOptions({
    method: 'POST',
    body: JSON.stringify({ orderId, reason }),
  }));
  return parseJson(response);
}

export async function getMyRefunds() {
  const response = await fetch(`${API_BASE}/refunds/my-refunds`, getFetchOptions());
  return parseJson(response);
}

export async function updateProfile(data) {
  const response = await fetch(`${API_BASE}/auth/me`, getFetchOptions({
    method: 'PUT',
    body: JSON.stringify(data),
  }));
  return parseJson(response);
}

export async function getPublicSettings() {
  const response = await fetch(`${API_BASE}/settings/public`, { cache: 'no-store' });
  return parseJson(response);
}

export async function verifyEmail(token) {
  const response = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseJson(response);
}

