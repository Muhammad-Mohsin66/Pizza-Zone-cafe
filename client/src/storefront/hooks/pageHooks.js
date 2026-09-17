import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { checkHealth, createOrder, listOrders, updateOrderStatus, getCategories, getProducts, getDeals, getBankAccounts, getPublicSettings, updateProfile } from '../utils/api';
import {
  getCart,
  setCart as persistCart,
  clearCart,
  preserveGuestCartThroughAuth,
} from '../utils/cart';
import {
  CHECKOUT_AUTH_MESSAGE,
  getPostAuthRedirectPath,
  isCheckoutAuthFlow,
  saveCheckoutReturnPath,
} from '../utils/checkoutAuth';

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

function getLocalJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function setLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const getImageUrl = (prod) => {
  if (prod.image) {
    if (prod.image.startsWith('http') || prod.image.startsWith('data:')) {
      return prod.image;
    }
    if (prod.image.startsWith('/images/')) {
      return prod.image;
    }
    const apiBase = API_BASE;
    const serverUrl = apiBase.replace('/api', '');
    return `${serverUrl}${prod.image.startsWith('/') ? '' : '/'}${prod.image}`;
  }
  const name = prod.name || prod.title || '';
  const lower = name.toLowerCase().trim();

  // Specific Deal Mappings
  if (lower.includes('z1 deal') || lower === 'z1') return '/images/deals/deal_z1.jpg';
  if (lower.includes('z2 deal') || lower === 'z2') return '/images/deals/deal_z2.jpg';
  if (lower.includes('z3 deal') || lower === 'z3') return '/images/deals/deal_z3.jpg';
  if (lower.includes('z4 deal') || lower === 'z4') return '/images/deals/deal_z4.jpg';
  if (lower.includes('z5 deal') || lower === 'z5') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z6 deal') || lower === 'z6') return '/images/deals/deal_z4.jpg';
  if (lower.includes('z7 deal') || lower === 'z7') return '/images/deals/deal_z7.jpg';
  if (lower.includes('z8 deal') || lower === 'z8') return '/images/deals/deal_z8.jpg';
  if (lower.includes('z9 deal') || lower === 'z9') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z10 deal') || lower === 'z10') return '/images/deals/deal_z10.jpg';
  if (lower.includes('z11 deal') || lower === 'z11') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z12 deal') || lower === 'z12') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z13 deal') || lower === 'z13') return '/images/deals/deal_z13.jpg';
  if (lower.includes('z14 deal') || lower === 'z14') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z15 deal') || lower === 'z15') return '/images/deals/deal_z1.jpg';
  if (lower.includes('z16 deal') || lower === 'z16') return '/images/deals/deal_z16.jpg';
  if (lower.includes('z17 deal') || lower === 'z17') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z18 deal') || lower === 'z18') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z19 deal') || lower === 'z19') return '/images/deals/deal_z5.jpg';
  if (lower.includes('z20 deal') || lower === 'z20') return '/images/deals/deal_z20.jpg';
  if (lower.includes('mega') || lower.includes('family deal')) return '/images/products/family_deals.jpg';

  if (lower.includes('crown') || lower.includes('extreme') || lower.includes('zone special') || lower.includes('bon fire') || lower.includes('stuffer')) {
    return '/images/products/zone_special_pizza.jpg';
  }
  if (lower.includes('pizza') || lower.includes('tikka') || lower.includes('fajita') || lower.includes('achari') || lower.includes('vegi') || lower.includes('cheese lover') || lower.includes('tandoori') || lower.includes('supreme') || lower.includes('malai boti') || lower.includes('bbq')) {
    return '/images/products/traditional_pizza.jpg';
  }
  if (lower.includes('grill') && lower.includes('burger')) {
    return '/images/products/grill_burger.jpg';
  }
  if (lower.includes('wehshi')) {
    return '/images/products/grill_burger.jpg';
  }
  if (lower.includes('burger')) {
    return '/images/products/zinger_burger.jpg';
  }
  if (lower.includes('shawarma')) {
    return '/images/products/chicken_shawarma.jpg';
  }
  if (lower.includes('paratha') || lower.includes('roll')) {
    return '/images/products/paratha_roll.jpg';
  }
  if (lower.includes('pasta') || lower.includes('macaroni')) {
    return '/images/products/creamy_pasta.jpg';
  }
  if (lower.includes('fries')) {
    return '/images/products/loaded_fries.jpg';
  }
  if (lower.includes('wings') || lower.includes('nuggets') || lower.includes('hot shots') || lower.includes('fried chicken') || lower.includes('fried')) {
    return '/images/products/fried_chicken.jpg';
  }
  if (lower.includes('deal') || lower.includes('family')) {
    return '/images/products/family_deals.jpg';
  }
  if (lower.includes('margarita') || lower.includes('lagoon') || lower.includes('lemonade') || lower.includes('lime') || lower.includes('beverage') || lower.includes('drink')) {
    return '/images/products/cold_beverage.jpg';
  }
  if (lower.includes('chai') || lower.includes('tea') || lower.includes('coffee') || lower.includes('cappuccino') || lower.includes('latte') || lower.includes('chocolate')) {
    return '/images/products/cold_beverage.jpg';
  }
  if (lower.includes('shake') || lower.includes('colada')) {
    return '/images/products/cold_beverage.jpg';
  }
  if (lower.includes('cake') || lower.includes('ice creme') || lower.includes('ice cream') || lower.includes('dessert')) {
    return '/images/products/molten_lava_cake.jpg';
  }
  return '/images/products/traditional_pizza.jpg';
};

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
export function useLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

  const fromCheckout = isCheckoutAuthFlow(searchParams);
  const checkoutNotice = fromCheckout ? CHECKOUT_AUTH_MESSAGE : '';

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostAuthRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (localStorage.getItem('cheezka_user')) return;
    const saved = getLocalJson('cheezka_login_form', {});
    setEmail(saved.email || '');
    setRememberMe(Boolean(saved.rememberMe));
  }, []);

  useEffect(() => {
    setLocalJson('cheezka_login_form', { email, rememberMe });
  }, [email, rememberMe]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setStatus({ message: 'Please fill in all fields', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password.length < 6) {
      setStatus({ message: 'Password must be at least 6 characters', bg: '#ffcdd2', color: '#c62828' });
      return;
    }

    setStatus({ message: 'Logging in…', bg: '#e3f2fd', color: '#0C4C7B' });

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || 'Login failed', bg: '#ffcdd2', color: '#c62828' });
        return;
      }

      const guestCart = preserveGuestCartThroughAuth();
      authLogin({ ...data.user, rememberMe }, data.token);
      localStorage.removeItem('cheezka_login_form');
      if (guestCart.length) {
        persistCart(guestCart);
      }

      const redirectTo = getPostAuthRedirectPath(data.user);
      setStatus({ message: 'Login successful! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate(redirectTo), 800);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    status,
    onSubmit,
    checkoutNotice,
    fromCheckout,
  };
}

// ─────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────
export function useSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, isAuthenticated, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [status, setStatus] = useState({ message: '', bg: '', color: '' });

  const fromCheckout = isCheckoutAuthFlow(searchParams);
  const checkoutNotice = fromCheckout ? CHECKOUT_AUTH_MESSAGE : '';
  const loginHref = fromCheckout ? '/login?from=checkout' : '/login';

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostAuthRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setStatus({ message: 'Please fill in all fields', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ message: 'Please enter a valid email address', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password.length < 8) {
      setStatus({ message: 'Password must be at least 8 characters', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ message: 'Passwords do not match', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    if (!termsAgreed) {
      setStatus({ message: 'You must agree to the terms and conditions', bg: '#ffcdd2', color: '#c62828' });
      return;
    }
    const phoneVal = phone.trim();
    if (!phoneVal || !/^\d{11}$/.test(phoneVal)) {
      setStatus({ message: 'Please enter a valid 11-digit phone number', bg: '#ffcdd2', color: '#c62828' });
      return;
    }

    setStatus({ message: 'Creating account…', bg: '#e3f2fd', color: '#0C4C7B' });

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phoneVal, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ message: data.message || 'Registration failed', bg: '#ffcdd2', color: '#c62828' });
        return;
      }

      if (data.requiresVerification) {
        setStatus({ message: data.message, bg: '#e8f5e9', color: '#2e7d32' });
        return;
      }

      const guestCart = preserveGuestCartThroughAuth();
      authLogin(data.user, data.token);
      if (guestCart.length) {
        persistCart(guestCart);
      }

      const redirectTo = getPostAuthRedirectPath(data.user);
      setStatus({ message: 'Account created! Redirecting…', bg: '#c8e6c9', color: '#1B2A49' });
      setTimeout(() => navigate(redirectTo), 800);
    } catch {
      setStatus({ message: 'Could not connect to server. Is the backend running?', bg: '#ffcdd2', color: '#c62828' });
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAgreed,
    setTermsAgreed,
    status,
    onSubmit,
    checkoutNotice,
    fromCheckout,
    loginHref,
  };
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export function useDashboardPage() {
  const navigate = useNavigate();
  const { user, logout: authLogout, isAuthenticated, loading, updateUser } = useAuth();
  const [apiStatus, setApiStatus] = useState({ message: '', error: false, visible: false });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', password: '' });
  const [editStatus, setEditStatus] = useState({ message: '', error: false });

  useEffect(() => {
    if (user && !isEditing) {
      setEditForm({ name: user.name || '', phone: user.phone || '', password: '' });
    }
  }, [user, isEditing]);

  const handleSaveProfile = async () => {
    try {
      setEditStatus({ message: 'Saving...', error: false });
      const data = {};
      if (editForm.name) data.name = editForm.name;
      if (editForm.phone) data.phone = editForm.phone;
      if (editForm.password) data.password = editForm.password;

      const res = await updateProfile(data);
      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditing(false);
        setEditStatus({ message: 'Profile updated successfully!', error: false });
        setTimeout(() => setEditStatus({ message: '', error: false }), 3000);
      } else {
        setEditStatus({ message: 'Failed to update profile.', error: true });
      }
    } catch (err) {
      setEditStatus({ message: err.message || 'Failed to update profile.', error: true });
    }
  };

  useEffect(() => {
    if (loading) return undefined;
    if (!isAuthenticated || !user) {
      const t = setTimeout(() => navigate('/login'), 1200);
      return () => clearTimeout(t);
    }

    (async () => {
      try {
        await checkHealth();
        setApiStatus({ message: 'Connected to backend API.', error: false, visible: true });
      } catch {
        setApiStatus({
          message: 'Could not connect to backend. Make sure the server is running.',
          error: true,
          visible: true,
        });
      }
    })();
    return undefined;
  }, [isAuthenticated, user, loading, navigate]);

  const logout = () => {
    authLogout();
    navigate('/login');
  };

  const displayName = useMemo(() => {
    if (!user) return '';
    return user.name || user.email?.split('@')[0] || '';
  }, [user]);

  return { 
    user, displayName, apiStatus, logout,
    isEditing, setIsEditing, editForm, setEditForm, editStatus, handleSaveProfile 
  };
}

// ─────────────────────────────────────────────
// Orders page
// ─────────────────────────────────────────────
export function useOrdersPage() {
  const [status, setStatus] = useState({ message: '', error: false, visible: false });
  const [orders, setOrders] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('--');
  const [savingId, setSavingId] = useState('');

  const loadOrders = async (showErrorBox = true) => {
    try {
      const data = await listOrders();
      // Backend returns { success, count, data }
      const list = data?.data ?? data;

      const mapped = (Array.isArray(list) ? list : []).map(order => ({
        order_id: order._id,
        created_at: order.createdAt || order.created_at,
        status: order.orderStatus || order.status,
        customer_name: order.customer?.name || order.customer_name || 'Customer',
        customer_phone: order.phoneNumber || order.customer_phone || '',
        customer_address: order.shippingAddress || order.customer_address || '',
        payment_method: order.paymentMethod || order.payment_method || 'COD',
        payment_status: order.paymentStatus || '',
        notes: order.notes || '',
        items: (order.orderItems || order.items || []).map(item => ({
          name: item.name,
          size: item.size,
          qty: item.quantity || item.qty,
          price: item.price
        })),
        total: order.grandTotal || order.total || order.totalAmount || 0,
        refund: order.refund || null
      }));

      setOrders(mapped);
      setStatus({ message: 'Connected to backend. Showing latest online orders.', error: false, visible: true });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      if (showErrorBox) {
        setStatus({ message: 'Failed to load orders. Make sure backend is running.', error: true, visible: true });
        setOrders([]);
      }
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  const saveStatus = async (orderId, newStatus) => {
    setSavingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setStatus({ message: `Order status updated for ${orderId}`, error: false, visible: true });
      await loadOrders(false);
    } catch (err) {
      setStatus({ message: err.message || 'Status update failed', error: true, visible: true });
    } finally {
      setSavingId('');
    }
  };

  return { status, orders, lastUpdated, savingId, refresh: () => loadOrders(true), saveStatus };
}

const TRAD_SIZES = [
  { size: 'Small', price: 550 },
  { size: 'Medium', price: 900 },
  { size: 'Large', price: 1350 },
  { size: 'X-Large', price: 1750 },
];

const ROYAL_SIZES = [
  { size: 'Small', price: 650 },
  { size: 'Medium', price: 1090 },
  { size: 'Large', price: 1490 },
  { size: 'X-Large', price: 2100 },
];

const ZONE_SIZES = [
  { size: 'Medium', price: 1590 },
  { size: 'Large', price: 1940 },
];

const STUFF_SIZES = [
  { size: 'Small', price: 780 },
  { size: 'Medium', price: 1250 },
  { size: 'Large', price: 1690 },
  { size: 'X-Large', price: 2190 },
];

const PASTA_SIZES = [
  { size: 'Small', price: 440 },
  { size: 'Large', price: 750 },
];

const NUGGET_SIZES = [
  { size: '6 Pcs', price: 299 },
  { size: '12 Pcs', price: 580 },
];

const HOT_SHOT_SIZES = [
  { size: '6 Pcs', price: 330 },
  { size: '12 Pcs', price: 650 },
];

const WINGS_SIZES = [
  { size: '6 Pcs', price: 340 },
  { size: '12 Pcs', price: 660 },
];

const GRILL_WINGS_SIZES = [
  { size: '6 Pcs', price: 399 },
  { size: '12 Pcs', price: 750 },
];

const FRIED_CHICKEN_SIZES = [
  { size: '6 Pcs', price: 690 },
  { size: '12 Pcs', price: 990 },
];

const PIZZA_ZONE_FALLBACK_CATEGORIES = [
  { _id: 'cat-1', name: 'Traditional Flavours', isActive: true },
  { _id: 'cat-2', name: 'Royal Flavours', isActive: true },
  { _id: 'cat-3', name: 'Zone Special Treat', isActive: true },
  { _id: 'cat-4', name: 'Stuff & Kabab Lovers', isActive: true },
  { _id: 'cat-5', name: 'Sticks Pizza', isActive: true },
  { _id: 'cat-6', name: 'Burgers', isActive: true },
  { _id: 'cat-7', name: 'Grill Burger', isActive: true },
  { _id: 'cat-8', name: 'Wehshi Burger', isActive: true },
  { _id: 'cat-9', name: 'Shawarma', isActive: true },
  { _id: 'cat-10', name: 'Paratha', isActive: true },
  { _id: 'cat-11', name: 'Wraps', isActive: true },
  { _id: 'cat-12', name: 'Panini Sandwich', isActive: true },
  { _id: 'cat-13', name: 'Pasta', isActive: true },
  { _id: 'cat-14', name: 'Fried', isActive: true },
  { _id: 'cat-15', name: 'Fries', isActive: true },
  { _id: 'cat-16', name: 'Super Family Deals', isActive: true },
  { _id: 'cat-17', name: 'Cold Beverage', isActive: true },
  { _id: 'cat-18', name: 'Hot Beverage', isActive: true },
  { _id: 'cat-19', name: 'Royal Drinks', isActive: true },
  { _id: 'cat-20', name: 'Freshness', isActive: true },
  { _id: 'cat-21', name: 'Dessert Sweet', isActive: true },
];

const PIZZA_ZONE_FALLBACK_PRODUCTS = [
  { _id: 'p-1', category: 'cat-1', name: 'Chicken Tikka', description: 'Chicken Tikka, Grilled Onion, Hot Chili, Black Olive, Fresh Tomato, Cheese & White Sauce', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-2', category: 'cat-1', name: 'Chicken Fajita Pizza', description: 'Grilled Chicken Paper, Bell Paper, Black Olive, White Sauce, Onion & Cheese', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-3', category: 'cat-1', name: 'Achari Pizza', description: 'Achari Special Chicken, Jala Peno, Cheese, Spicy White Sauce, Green Chili & Olive', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-4', category: 'cat-1', name: 'Vegi Pizza', description: 'Cheese, Paprika, Fresh Tomato, Onion, Black Olive, Mushroom & White Paste', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-5', category: 'cat-1', name: 'Cheese Lover', description: 'Extra Mozzarella Cheese, Chicken, White Sauce, Lemon Taste & Fresh Tomato', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-6', category: 'cat-1', name: 'Tandoori Pizza', description: 'Tandoori Chicken, Onion, Grilled Mushroom, Bell Paper, Jalapeno, Cheese & Spicy White Sauce', sizes: TRAD_SIZES, isActive: true },
  { _id: 'p-7', category: 'cat-1', name: 'Hot & Spicy Pizza', description: 'Marinate Chicken, Roasted Onion, Taco, Bell Paper, Jalapeno, Olive, Cheese, White Sauce & Green Chili', sizes: TRAD_SIZES, isActive: true },

  { _id: 'p-8', category: 'cat-2', name: 'Zone Special Pizza', description: 'House special blend of chicken, mushrooms, black olives & royal cheese', sizes: ROYAL_SIZES, isActive: true },
  { _id: 'p-9', category: 'cat-2', name: 'Chicken Supreme', description: 'Loaded with chicken tikka, fajita chunks, capsicum & onions', sizes: ROYAL_SIZES, isActive: true },
  { _id: 'p-10', category: 'cat-2', name: 'Malai Boti Pizza', description: 'Tender malai boti chicken chunks with creamy white sauce', sizes: ROYAL_SIZES, isActive: true },
  { _id: 'p-11', category: 'cat-2', name: 'Creemi Pizza', description: 'Rich cream cheese base topped with spiced chicken & herbs', sizes: ROYAL_SIZES, isActive: true },
  { _id: 'p-12', category: 'cat-2', name: 'BBQ Pizza', description: 'Smoky BBQ chicken, grilled onions & tangy BBQ sauce drizzle', sizes: ROYAL_SIZES, isActive: true },

  { _id: 'p-13', category: 'cat-3', name: 'Zone Special Extreme', description: 'Double loaded cheese and chicken with extreme spices', sizes: ZONE_SIZES, isActive: true },
  { _id: 'p-14', category: 'cat-3', name: 'Bon Fire Pizza', description: 'Fiery hot spicy chicken, chili flakes & flaming sauce', sizes: ZONE_SIZES, isActive: true },
  { _id: 'p-15', category: 'cat-3', name: 'Chicken & Cheese Stuffer', description: 'Stuffed crust with molten cheese and savory chicken center', sizes: ZONE_SIZES, isActive: true },
  { _id: 'p-16', category: 'cat-3', name: 'Crown Crust Pizza', description: 'Crown crust filled with rich cream cheese bites', sizes: ZONE_SIZES, isActive: true },
  { _id: 'p-17', category: 'cat-3', name: 'Kabab Lovers Special', description: 'Seekh kababs embedded right into the crust', sizes: ZONE_SIZES, isActive: true },

  { _id: 'p-18', category: 'cat-4', name: 'Seek Kabab Pizza', description: 'Juicy seekh kabab pieces with spicy tomato sauce', sizes: STUFF_SIZES, isActive: true },
  { _id: 'p-19', category: 'cat-4', name: 'Stuff Crust Pizza', description: 'Mozzarella cheese stuffed into outer crust ring', sizes: STUFF_SIZES, isActive: true },
  { _id: 'p-20', category: 'cat-4', name: 'Lazania Cheese Pizza', description: 'Layered lasagna style pizza with rich melted cheese', sizes: STUFF_SIZES, isActive: true },
  { _id: 'p-21', category: 'cat-4', name: 'Lazania Kabab Pizza', description: 'Lasagna style layered pizza topped with seekh kabab chunks', sizes: STUFF_SIZES, isActive: true },
  { _id: 'p-22', category: 'cat-4', name: 'Behari Kabab Pizza', description: 'Spicy Behari kabab pieces with green chilies & herbs', sizes: STUFF_SIZES, isActive: true },

  { _id: 'p-23', category: 'cat-5', name: 'Ch. Cheese Sticks', basePrice: 900, description: 'Baked pizza sticks stuffed with cheese', isActive: true },
  { _id: 'p-24', category: 'cat-5', name: 'Ch. Kabab Sticks', basePrice: 900, description: 'Pizza dough wrapped around chicken kababs', isActive: true },
  { _id: 'p-25', category: 'cat-5', name: 'Ch. Behari Roll', basePrice: 800, description: 'Spicy Behari chicken wrapped in pizza dough', isActive: true },

  { _id: 'p-26', category: 'cat-6', name: 'Zinger Burger', basePrice: 330, isActive: true },
  { _id: 'p-27', category: 'cat-6', name: 'Z.S Zinger Burger', basePrice: 410, isActive: true },
  { _id: 'p-28', category: 'cat-6', name: 'Pizza Burger', basePrice: 520, isActive: true },
  { _id: 'p-29', category: 'cat-6', name: 'Zinger Cheese Burger', basePrice: 380, isActive: true },
  { _id: 'p-30', category: 'cat-6', name: 'Zinger Jumbo Burger', basePrice: 570, isActive: true },
  { _id: 'p-31', category: 'cat-6', name: 'Zinger Tower Burger', basePrice: 560, isActive: true },
  { _id: 'p-32', category: 'cat-6', name: 'Ragi Burger', basePrice: 290, isActive: true },
  { _id: 'p-33', category: 'cat-6', name: 'Ragi Cheese Burger', basePrice: 340, isActive: true },
  { _id: 'p-34', category: 'cat-6', name: 'Chapli Burger', basePrice: 290, isActive: true },

  { _id: 'p-35', category: 'cat-7', name: 'Grill Burger', basePrice: 450, isActive: true },
  { _id: 'p-36', category: 'cat-7', name: 'Grill Jalapeno', basePrice: 540, isActive: true },
  { _id: 'p-37', category: 'cat-7', name: 'Grill Mushroom', basePrice: 540, isActive: true },
  { _id: 'p-38', category: 'cat-7', name: 'Mighty Grill Burger', basePrice: 680, isActive: true },

  { _id: 'p-39', category: 'cat-8', name: 'Wehshi Burger', basePrice: 1099, description: 'Monster stacked double zinger patty with cheese & loaded sauce', isActive: true },

  { _id: 'p-40', category: 'cat-9', name: 'Chicken Shawarma', basePrice: 199, isActive: true },
  { _id: 'p-41', category: 'cat-9', name: 'Chicken Cheese Shawarma', basePrice: 249, isActive: true },
  { _id: 'p-42', category: 'cat-9', name: 'Crispy Zinger Shawarma', basePrice: 310, isActive: true },
  { _id: 'p-43', category: 'cat-9', name: 'Grill Shawarma', basePrice: 290, isActive: true },
  { _id: 'p-44', category: 'cat-9', name: 'Grill Cheese Shawarma', basePrice: 360, isActive: true },
  { _id: 'p-45', category: 'cat-9', name: 'Zinger Cheese Shawarma', basePrice: 360, isActive: true },

  { _id: 'p-46', category: 'cat-10', name: 'Chicken Roll Paratha', basePrice: 299, isActive: true },
  { _id: 'p-47', category: 'cat-10', name: 'Tikka Paratha', basePrice: 320, isActive: true },
  { _id: 'p-48', category: 'cat-10', name: 'Zinger Roll Paratha', basePrice: 330, isActive: true },
  { _id: 'p-49', category: 'cat-10', name: 'Zinger Cheese Roll Paratha', basePrice: 380, isActive: true },

  { _id: 'p-50', category: 'cat-11', name: 'Special Wrap', basePrice: 540, isActive: true },
  { _id: 'p-51', category: 'cat-11', name: 'Ch. Twister Wrap', basePrice: 450, isActive: true },
  { _id: 'p-52', category: 'cat-11', name: 'Crispy Wrap', basePrice: 450, isActive: true },
  { _id: 'p-53', category: 'cat-11', name: 'Grill Ch. Wrap', basePrice: 490, isActive: true },

  { _id: 'p-54', category: 'cat-12', name: 'Polo Milano Sandwich', basePrice: 650, isActive: true },
  { _id: 'p-55', category: 'cat-12', name: 'Polo Tanduri Sandwich', basePrice: 650, isActive: true },
  { _id: 'p-56', category: 'cat-12', name: 'Ch. Crispy Sandwich', basePrice: 690, isActive: true },
  { _id: 'p-57', category: 'cat-12', name: 'Cheesy Sandwich', basePrice: 750, isActive: true },

  { _id: 'p-58', category: 'cat-13', name: 'Sp. Zone Macaroni', sizes: PASTA_SIZES, isActive: true },
  { _id: 'p-59', category: 'cat-13', name: 'Peri Peri Pasta', sizes: PASTA_SIZES, isActive: true },
  { _id: 'p-60', category: 'cat-13', name: 'Creamy Pasta', sizes: PASTA_SIZES, isActive: true },
  { _id: 'p-61', category: 'cat-13', name: 'Crunchy Pasta', sizes: [{ size: 'Small', price: 570 }, { size: 'Large', price: 870 }], isActive: true },

  { _id: 'p-62', category: 'cat-14', name: 'Chicken Nuggets', sizes: NUGGET_SIZES, isActive: true },
  { _id: 'p-63', category: 'cat-14', name: 'Chicken Hot Shots', sizes: HOT_SHOT_SIZES, isActive: true },
  { _id: 'p-64', category: 'cat-14', name: 'Chicken Hot Wings', sizes: WINGS_SIZES, isActive: true },
  { _id: 'p-65', category: 'cat-14', name: 'Grill Wings', sizes: GRILL_WINGS_SIZES, isActive: true },
  { _id: 'p-66', category: 'cat-14', name: 'Fried Chicken', sizes: FRIED_CHICKEN_SIZES, isActive: true },

  { _id: 'p-67', category: 'cat-15', name: 'Small Fries', basePrice: 170, isActive: true },
  { _id: 'p-68', category: 'cat-15', name: 'Medium Fries', basePrice: 230, isActive: true },
  { _id: 'p-69', category: 'cat-15', name: 'Large Fries', basePrice: 320, isActive: true },
  { _id: 'p-70', category: 'cat-15', name: 'Masala Fries', basePrice: 270, isActive: true },
  { _id: 'p-71', category: 'cat-15', name: 'Garlic Mayo Fries', basePrice: 310, isActive: true },
  { _id: 'p-72', category: 'cat-15', name: 'Pizza Fries', basePrice: 510, isActive: true },
  { _id: 'p-73', category: 'cat-15', name: 'Loaded Fries', basePrice: 520, isActive: true },

  { _id: 'p-74', category: 'cat-16', name: 'Z1 Deal', basePrice: 999, description: '1 Small Pizza + 1 Zinger Burger + 1 Liter Drink', isActive: true },
  { _id: 'p-75', category: 'cat-16', name: 'Z2 Deal', basePrice: 880, description: '7 Pcs Hot Wings + 7 Pcs Nuggets + 500ml Drink', isActive: true },
  { _id: 'p-76', category: 'cat-16', name: 'Z3 Deal', basePrice: 740, description: '2 Zinger Burger + 500ml Drink', isActive: true },
  { _id: 'p-77', category: 'cat-16', name: 'Z4 Deal', basePrice: 1999, description: '1 Large Pizza + 6 Pcs Hot Wings + 6 Pcs Nuggets + 1.5 Liter Drink', isActive: true },
  { _id: 'p-78', category: 'cat-16', name: 'Z5 Deal', basePrice: 1490, description: '1 Large Pizza + 1.5 Liter Drink', isActive: true },
  { _id: 'p-79', category: 'cat-16', name: 'Z6 Deal', basePrice: 1450, description: '1 Medium Pizza + 4 Pcs Hot Wings + 4 Pcs Nuggets + 1 Liter Drink', isActive: true },
  { _id: 'p-80', category: 'cat-16', name: 'Z7 Deal', basePrice: 599, description: '1 Zinger Burger + 1 Regular Fries + 1 Tin Pack', isActive: true },
  { _id: 'p-81', category: 'cat-16', name: 'Z8 Deal', basePrice: 1060, description: '1 Small Pizza + 1 Small Pasta + 500ml Cold Drink', isActive: true },
  { _id: 'p-82', category: 'cat-16', name: 'Z9 Deal', basePrice: 1920, description: '2 Medium Pizza + 1.5 Liter Drink', isActive: true },
  { _id: 'p-83', category: 'cat-16', name: 'Z10 Deal', basePrice: 2090, description: '6 Zinger Burger + 1.5 Liter Drink', isActive: true },
  { _id: 'p-84', category: 'cat-16', name: 'Z11 Deal', basePrice: 2780, description: '2 Large Pizza + 1.5 Liter Drink', isActive: true },
  { _id: 'p-85', category: 'cat-16', name: 'Z12 Deal', basePrice: 980, description: '1 Medium Pizza + 500ml Drink', isActive: true },
  { _id: 'p-86', category: 'cat-16', name: 'Z13 Deal', basePrice: 1990, description: '1 Large Pizza + 1 Zinger Burger + 1 Chicken Shawarma + 1.5 Liter Drink', isActive: true },
  { _id: 'p-87', category: 'cat-16', name: 'Z14 Deal', basePrice: 4270, description: '3 Large Pizza + 2 1.5 Liter Drink', isActive: true },
  { _id: 'p-88', category: 'cat-16', name: 'Z15 Deal', basePrice: 1660, description: '1 Medium Pizza + 2 Zinger Burger + 1 Liter Drink', isActive: true },
  { _id: 'p-89', category: 'cat-16', name: 'Z16 Deal', basePrice: 1460, description: '2 Zinger Roll Paratha + 3 Pcs Fried Chicken + 1 Liter Drink', isActive: true },
  { _id: 'p-90', category: 'cat-16', name: 'Z17 Deal', basePrice: 2350, description: '1 Large Pizza + 1 Medium Pizza + 1.5 Liter Drink', isActive: true },
  { _id: 'p-91', category: 'cat-16', name: 'Z18 Deal', basePrice: 1220, description: '2 Small Pizza + 1 Liter Drink', isActive: true },
  { _id: 'p-92', category: 'cat-16', name: 'Z19 Deal', basePrice: 1870, description: '1 Family Pizza + 1.5 Liter Drink', isActive: true },
  { _id: 'p-93', category: 'cat-16', name: 'Z20 Deal', basePrice: 980, description: '1 Small Pizza + 4 Pcs Wings + 2 Pcs Nuggets + 500ml Drink', isActive: true },
  { _id: 'p-94', category: 'cat-16', name: 'Family Mega Deal', basePrice: 5550, description: '2 Large Pizza + 8 Pcs Wings + 8 Pcs Nuggets + 2 Zinger + 2 Shawarma + 1 Pasta + 2 1.5L Drinks', isActive: true },

  { _id: 'p-95', category: 'cat-17', name: 'Lemonade', basePrice: 280, isActive: true },
  { _id: 'p-96', category: 'cat-17', name: 'Mint Margarita', basePrice: 300, isActive: true },
  { _id: 'p-97', category: 'cat-17', name: 'Blue Lagoon', basePrice: 350, isActive: true },
  { _id: 'p-98', category: 'cat-17', name: 'Strawberry Margraita', basePrice: 350, isActive: true },
  { _id: 'p-99', category: 'cat-17', name: 'Blue Berry Margraita', basePrice: 350, isActive: true },
  { _id: 'p-100', category: 'cat-17', name: 'Fresh Lime', basePrice: 150, isActive: true },

  { _id: 'p-101', category: 'cat-18', name: 'Kashmiri Chai', basePrice: 150, isActive: true },
  { _id: 'p-102', category: 'cat-18', name: 'Karak Chai', basePrice: 150, isActive: true },
  { _id: 'p-103', category: 'cat-18', name: 'Cardamom Tea', basePrice: 150, isActive: true },
  { _id: 'p-104', category: 'cat-18', name: 'Green Tea', basePrice: 100, isActive: true },
  { _id: 'p-105', category: 'cat-18', name: 'Cappuccino', basePrice: 350, isActive: true },
  { _id: 'p-106', category: 'cat-18', name: 'Latte', basePrice: 320, isActive: true },
  { _id: 'p-107', category: 'cat-18', name: 'Belgian Hot Chocolate', basePrice: 500, isActive: true },
  { _id: 'p-108', category: 'cat-18', name: 'American Coffee', basePrice: 200, isActive: true },

  { _id: 'p-109', category: 'cat-19', name: 'Zone Special Power Shake', basePrice: 550, isActive: true },
  { _id: 'p-110', category: 'cat-19', name: 'Ice Cream Shake', basePrice: 420, isActive: true },
  { _id: 'p-111', category: 'cat-19', name: 'Signature Cold Coffee', basePrice: 420, isActive: true },
  { _id: 'p-112', category: 'cat-19', name: 'Pina Colada', basePrice: 490, isActive: true },
  { _id: 'p-113', category: 'cat-19', name: 'Iced Café Latte', basePrice: 490, isActive: true },

  { _id: 'p-114', category: 'cat-20', name: 'Tin Drink', basePrice: 120, isActive: true },
  { _id: 'p-115', category: 'cat-20', name: 'Reg. Drink', basePrice: 80, isActive: true },
  { _id: 'p-116', category: 'cat-20', name: '500 ML Drink', basePrice: 140, isActive: true },
  { _id: 'p-117', category: 'cat-20', name: '1 Ltr. Drink', basePrice: 200, isActive: true },
  { _id: 'p-118', category: 'cat-20', name: '1.5 Ltr. Drink', basePrice: 260, isActive: true },
  { _id: 'p-119', category: 'cat-20', name: '500 ML Water', basePrice: 60, isActive: true },
  { _id: 'p-120', category: 'cat-20', name: '1.5 Ltr. Water', basePrice: 100, isActive: true },

  { _id: 'p-121', category: 'cat-21', name: 'Ice Creme', sizes: [{ size: '1 Scoop', price: 100 }, { size: '2 Scoop', price: 200 }], isActive: true },
  { _id: 'p-122', category: 'cat-21', name: 'Mountain Lawa Cake', basePrice: 390, isActive: true }
];

// ─────────────────────────────────────────────
// Shop / Cart
// ─────────────────────────────────────────────
export function useShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCartState] = useState(() => getCart());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });
  const [placing, setPlacing] = useState(false);
  const [menuVersion, setMenuVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [storeSettings, setStoreSettings] = useState({ taxPercentage: 0, deliveryCharge: 0 });

  useEffect(() => {
    getBankAccounts()
      .then(res => {
        if (res.success && res.data) {
          setBankAccounts(res.data);
        }
      })
      .catch(err => console.error("Failed to fetch bank accounts:", err));

    getPublicSettings()
      .then(res => {
        if (res.success && res.data) {
          setStoreSettings({
            taxPercentage: Number(res.data.TAX_PERCENTAGE) || 0,
            deliveryCharge: Number(res.data.DELIVERY_BASE_CHARGE) || 0
          });
        }
      })
      .catch(err => console.error("Failed to fetch settings:", err));
  }, []);

  useEffect(() => {
    const container = document.getElementById('cart-bank-accounts');
    if (!container) return;

    if (bankAccounts.length === 0) {
      container.innerHTML = '<div style="font-size: 11px; color: #dc2626;">No bank accounts configured.</div>';
      return;
    }

    const esc = (text) =>
      String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    container.innerHTML = bankAccounts.map(bank => {
      return `
        <div style="background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; font-size: 11px; color: #334155;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${esc(bank.bankName)}</div>
          <div style="display: grid; grid-template-columns: 50px 1fr; gap: 2px;">
            <span style="color: #64748b;">Title:</span> <span style="font-weight: 600;">${esc(bank.accountTitle)}</span>
            <span style="color: #64748b;">Acc:</span> <span style="font-weight: 600; font-family: monospace;">${esc(bank.accountNumber)}</span>
            ${bank.iban ? `<span style="color: #64748b;">IBAN:</span> <span style="font-weight: 600; font-family: monospace;">${esc(bank.iban)}</span>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }, [bankAccounts, drawerOpen]);

  const updateCart = (updater) => {
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistCart(next);
      return next;
    });
  };

  useEffect(() => {
    setCartState(getCart());
  }, [location.pathname, location.search]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('cart') === '1' || query.get('checkout') === '1') {
      setDrawerOpen(true);
      if (query.get('checkout') === '1') {
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');

    if (nameInput && !nameInput.value) {
      nameInput.value = user.name || '';
    }
    if (phoneInput && !phoneInput.value) {
      phoneInput.value = user.phone || '';
    }
  }, [isAuthenticated, user, drawerOpen]);

  useEffect(() => {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    const itemsEl = document.getElementById('cart-items');
    
    const subtotalEl = document.getElementById('cart-subtotal');
    const deliveryEl = document.getElementById('cart-delivery');
    const deliveryRowEl = document.getElementById('cart-delivery-row');
    const taxEl = document.getElementById('cart-tax');
    const taxRowEl = document.getElementById('cart-tax-row');

    if (!countEl || !totalEl || !itemsEl) return;

    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const subtotalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
    const taxAmount = Math.round((subtotalAmount * storeSettings.taxPercentage) / 100);
    const deliveryAmount = cart.length > 0 ? storeSettings.deliveryCharge : 0;
    const totalAmount = subtotalAmount + taxAmount + deliveryAmount;

    countEl.textContent = `${totalCount}`;
    totalEl.textContent = `${totalAmount}`;
    
    if (subtotalEl) subtotalEl.textContent = `${subtotalAmount}`;
    if (deliveryEl) deliveryEl.textContent = `${deliveryAmount}`;
    if (taxEl) taxEl.textContent = `${taxAmount}`;

    if (deliveryRowEl) {
      deliveryRowEl.style.display = cart.length > 0 ? "flex" : "none";
    }
    if (taxRowEl) {
      taxRowEl.style.display = cart.length > 0 ? "flex" : "none";
    }

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="cart-empty">No items yet. Add your favorite menu items.</div>';
      return;
    }

    const esc = (text) =>
      String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    itemsEl.innerHTML = cart
      .map(
        (item, index) => `
      <div class="cart-item">
        <p class="cart-item-title">${esc(item.name)}</p>
        <div class="cart-item-size">${esc(item.size ? `Size: ${item.size}` : 'Single item')}</div>
        <div class="cart-row">
          <div class="qty-controls">
            <button class="qty-btn" data-action="minus" data-index="${index}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-index="${index}">+</button>
          </div>
          <div class="cart-price">Rs. ${item.qty * item.price}</div>
        </div>
        <button class="remove-btn" data-action="remove" data-index="${index}">Remove</button>
      </div>
    `
      )
      .join('');

    itemsEl.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.getAttribute('data-index'));
        const action = btn.getAttribute('data-action');
        updateCart((prev) => {
          const next = [...prev];
          if (!next[index]) return prev;
          if (action === 'plus') next[index] = { ...next[index], qty: next[index].qty + 1 };
          if (action === 'minus') next[index] = { ...next[index], qty: next[index].qty - 1 };
          if (action === 'remove' || next[index].qty <= 0) next.splice(index, 1);
          return next;
        });
      });
    });
  }, [cart, storeSettings]);

  useEffect(() => {
    let active = true;
    function getCategoryIcon(name) {
      const n = name.toLowerCase();
      if (n.includes('pizza')) return 'fas fa-fire';
      if (n.includes('burger')) return 'fas fa-hamburger';
      if (n.includes('shawarma') || n.includes('wrap')) return 'fas fa-utensils';
      if (n.includes('pasta') || n.includes('fries')) return 'fas fa-leaf';
      return 'fas fa-utensils';
    }

    async function loadAndRender() {
      let categories = [];
      let products = [];
      try {
        const [catRes, prodRes] = await Promise.all([getCategories(), getProducts()]);
        categories = catRes.data || catRes || [];
        products = prodRes.data || prodRes || [];
      } catch (err) {
        console.warn('API unavailable, using Pizza Zone & Cafe local menu dataset:', err);
      }

      if (!active) return;
      const container = document.getElementById('dynamic-menu-container');
      if (!container) return;

      if (!categories || categories.length === 0 || !products || products.length === 0) {
        categories = PIZZA_ZONE_FALLBACK_CATEGORIES;
        products = PIZZA_ZONE_FALLBACK_PRODUCTS;
      }

      const activeCats = categories.filter(c => c.isActive !== false);
      const activeProds = products.filter(p => p.isActive !== false);

      if (activeProds.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 ck-w-100">
            <div style="font-size: 3rem; margin-bottom: 15px;">🍽️</div>
            <h3 style="color:#005F6B; font-weight:800; font-family:'Nunito Sans',sans-serif;">Our Kitchen is Preparing!</h3>
            <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">We are currently updating our menu items. Please check back in a few minutes!</p>
          </div>
        `;
        setLoading(false);
        return;
      }

      const grouped = {};
      activeCats.forEach(cat => {
        grouped[cat._id] = {
          name: cat.name,
          description: cat.description,
          products: []
        };
      });

      activeProds.forEach(prod => {
        const catId = prod.category?._id || prod.category;
        if (grouped[catId]) {
          grouped[catId].products.push(prod);
        }
      });

      let html = '';
      let sectionIndex = 0;
      activeCats.forEach((cat) => {
        const catGroup = grouped[cat._id];
        if (!catGroup || catGroup.products.length === 0) return;

        const iconClass = getCategoryIcon(cat.name);

        if (sectionIndex > 0) {
          html += `<hr class="section-divider">`;
        }
        sectionIndex++;

        html += `
          <div class="menu-section">
            <div class="section-header">
              <h2><i class="${iconClass} ck-icon-accent ck-fs-15r ck-mr-8"></i> ${cat.name}</h2>
            </div>
            <div class="row">
              ${catGroup.products.map(prod => {
          const hasSizes = prod.sizes && prod.sizes.length > 0;
          const sizeBoxes = hasSizes
            ? prod.sizes.map((s, idx) => `
                      <div class="size-box ${idx === 0 ? 'active' : ''}">
                        <span class="size-label">${s.size}</span>
                        <span class="size-price">${s.price}/-</span>
                      </div>
                    `).join('')
            : '';

          return `
                  <div class="col-lg-3 col-md-4 col-sm-6 col-12 mb-4">
                    <div class="menu-card" data-product-id="${prod._id}">
                      <div class="menu-card-img-wrap">
                        <img src="${getImageUrl(prod)}" alt="${prod.name}" class="menu-card-img" />
                        ${prod.stockQuantity <= 0 ? '<span class="menu-badge" style="background:#dc2626;color:white;">Out of Stock</span>' : ''}
                      </div>
                      <p class="menu-item-name">${prod.name}</p>
                      ${prod.description ? `<p style="font-size:11px; color:#64748b; margin:-4px 0 8px 0; text-align:center;">${prod.description}</p>` : ''}
                      ${hasSizes
              ? `<div class="size-grid">${sizeBoxes}</div>`
              : `
                          <div class="single-price-wrap">
                            <span class="price-amount">Rs. ${prod.basePrice}/-</span>
                          </div>
                        `}
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      setLoading(false);
      setMenuVersion(v => v + 1);
    }

    loadAndRender();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;

    const parsePrice = (raw) => {
      const cleaned = String(raw || '').replace(/[^0-9]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 0;
    };

    const addToCart = (productId, name, size, price) => {
      updateCart((prev) => {
        const found = prev.find((item) => item.name === name && item.size === size && item.price === price);
        if (found) {
          return prev.map((item) => (item === found ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { product: productId, name, size, price, qty: 1 }];
      });
      setStatus({ message: `Added to cart: ${name}${size ? ` (${size})` : ''}`, error: false });
    };

    document.querySelectorAll('.menu-card').forEach((card) => {
      if (card.getAttribute('data-cart-enhanced') === '1') return;
      const itemName = card.querySelector('.menu-item-name')?.textContent?.trim();
      if (!itemName) return;

      const sizeBoxes = card.querySelectorAll('.size-box');

      // Helper to retrieve the current active size and price
      const getActiveSizeInfo = () => {
        if (sizeBoxes.length === 0) {
          const priceText = card.querySelector('.price-amount')?.textContent || '0';
          return { size: 'Regular', price: parsePrice(priceText) };
        }
        const activeBox = card.querySelector('.size-box.active');
        if (!activeBox) {
          // Fallback to first box if none active
          const firstBox = sizeBoxes[0];
          const size = firstBox?.querySelector('.size-label')?.textContent?.trim() || 'Regular';
          const price = parsePrice(firstBox?.querySelector('.size-price')?.textContent);
          return { size, price };
        }
        const size = activeBox.querySelector('.size-label')?.textContent?.trim() || 'Regular';
        const price = parsePrice(activeBox.querySelector('.size-price')?.textContent);
        return { size, price };
      };

      // Create Dynamic Price Display
      const priceDisplay = document.createElement('div');
      priceDisplay.className = 'card-price-display';

      // Create Action buttons container
      const actionsRow = document.createElement('div');
      actionsRow.className = 'card-actions-row';

      const addBtn = document.createElement('button');
      addBtn.className = 'card-add-btn';
      addBtn.type = 'button';
      addBtn.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';

      const buyBtn = document.createElement('button');
      buyBtn.className = 'card-buy-btn';
      buyBtn.type = 'button';
      buyBtn.textContent = 'Buy Now';

      actionsRow.appendChild(addBtn);
      actionsRow.appendChild(buyBtn);

      card.appendChild(priceDisplay);
      card.appendChild(actionsRow);

      if (sizeBoxes.length > 0) {
        // Multi-size setup: set first active by default
        sizeBoxes[0].classList.add('active');
        const initial = getActiveSizeInfo();
        priceDisplay.textContent = `Rs. ${initial.price}/-`;

        sizeBoxes.forEach((box) => {
          // Add cursor pointer hint
          box.style.cursor = 'pointer';
          box.addEventListener('click', () => {
            sizeBoxes.forEach((b) => b.classList.remove('active'));
            box.classList.add('active');
            const current = getActiveSizeInfo();
            priceDisplay.textContent = `Rs. ${current.price}/-`;
          });
        });
      } else {
        // Single-price setup
        const initial = getActiveSizeInfo();
        priceDisplay.textContent = `Rs. ${initial.price}/-`;
      }

      // Action Handlers
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { size, price } = getActiveSizeInfo();
        const productId = card.getAttribute('data-product-id');
        addToCart(productId, itemName, size, price);
      });

      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { size, price } = getActiveSizeInfo();
        const productId = card.getAttribute('data-product-id');
        addToCart(productId, itemName, size, price);
        setDrawerOpen(true);
        setTimeout(() => document.getElementById('customer-name')?.focus(), 120);
      });

      card.setAttribute('data-cart-enhanced', '1');
    });
  }, [menuVersion, loading]);

  useEffect(() => {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.toggle('open', drawerOpen);
    backdrop.classList.toggle('open', drawerOpen);
    document.body.classList.toggle('ck-no-scroll', drawerOpen);
  }, [drawerOpen]);

  useEffect(() => {
    const openBtn = document.getElementById('open-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');
    const backdrop = document.getElementById('cart-backdrop');
    const placeBtn = document.getElementById('place-order-btn');

    const open = () => setDrawerOpen(true);
    const close = () => setDrawerOpen(false);

    const requireAuthForCheckout = () => {
      if (isAuthenticated && user?.email) {
        return true;
      }

      setStatus({ message: `${CHECKOUT_AUTH_MESSAGE} Redirecting…`, error: true });
      saveCheckoutReturnPath('/shop?checkout=1');
      setTimeout(() => navigate('/login?from=checkout'), 700);
      return false;
    };

    const place = async () => {
      if (!cart.length) {
        setStatus({ message: 'Cart is empty. Add items first.', error: true });
        return;
      }

      if (!requireAuthForCheckout()) {
        return;
      }

      const name = document.getElementById('customer-name')?.value || '';
      const phone = document.getElementById('customer-phone')?.value || '';
      const address = document.getElementById('customer-address')?.value || '';
      const paymentMethod = document.getElementById('payment-method')?.value || 'Cash on Delivery';
      const notes = document.getElementById('order-notes')?.value || '';

      if (!name.trim() || !phone.trim() || !address.trim()) {
        setStatus({ message: 'Please fill name, phone, and address.', error: true });
        return;
      }

      let transactionId = '';
      let screenshotFile = null;
      if (paymentMethod === 'Online Payment') {
        transactionId = document.getElementById('transaction-id')?.value || '';
        const fileInput = document.getElementById('payment-screenshot');
        screenshotFile = fileInput?.files?.[0] || null;

        if (!transactionId.trim() || !screenshotFile) {
          setStatus({ message: 'Transaction ID and Screenshot are required for Online Payment.', error: true });
          return;
        }
      }

      setPlacing(true);
      try {
        const total = cart.reduce((acc, item) => acc + item.qty * item.price, 0);

        // Normalize payment method to what backend validator expects: COD or Online
        const mappedPaymentMethod = paymentMethod === 'Online Payment' ? 'Online' : 'COD';

        // Map cart items to backend format (ensuring size is S, M, L, XL)
        const mappedItems = cart.map(item => {
          let normalizedSize = 'M';
          if (item.size === 'S' || item.size === 'Single') normalizedSize = 'S';
          else if (item.size === 'M' || item.size === 'Regular') normalizedSize = 'M';
          else if (item.size === 'L' || item.size === 'Large') normalizedSize = 'L';
          else if (item.size === 'XL') normalizedSize = 'XL';

          return {
            product: item.product || undefined,
            name: item.name,
            size: normalizedSize,
            quantity: item.qty,
            price: item.price
          };
        });

        // Ensure 11-digit phone number mapping for backend validator
        let normalizedPhone = phone.replace(/[^0-9]/g, '');
        if (normalizedPhone.length > 11) normalizedPhone = normalizedPhone.slice(-11);
        else if (normalizedPhone.length < 11) normalizedPhone = normalizedPhone.padStart(11, '0');

        const savedOrder = await createOrder({
          orderItems: mappedItems,
          shippingAddress: address.trim(),
          phoneNumber: normalizedPhone,
          paymentMethod: mappedPaymentMethod,
          notes: notes.trim()
        });
        const orderId = savedOrder?._id || savedOrder?.data?._id || savedOrder?.order_id || '';

        if (mappedPaymentMethod === 'Online' && screenshotFile) {
          setStatus({ message: 'Order created. Uploading receipt...', error: false });
          const formData = new FormData();
          formData.append('order', orderId);
          formData.append('transactionId', transactionId.trim());
          formData.append('screenshot', screenshotFile);
          formData.append('amount', savedOrder?.data?.grandTotal || total);
          formData.append('paymentMethod', mappedPaymentMethod);

          // Using global API_BASE
          const uploadHeaders = {};
          const token = localStorage.getItem('customerToken');
          if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

          const uploadRes = await fetch(`${API_BASE}/payments/upload/${orderId}`, {
            method: 'POST',
            headers: uploadHeaders,
            body: formData
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(`Order placed, but receipt upload failed: ${errData.message || errData.detail || 'Unknown error'}`);
          }
        }

        clearCart();
        localStorage.removeItem('cheezka_checkout_form');
        updateCart([]);
        setDrawerOpen(false);
        navigate(orderId ? `/order-confirmation?orderId=${encodeURIComponent(orderId)}` : '/order-confirmation');
        return;
      } catch (err) {
        setStatus({ message: `Order failed: ${err.message}`, error: true });
      } finally {
        setPlacing(false);
      }
    };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    placeBtn?.addEventListener('click', place);

    return () => {
      openBtn?.removeEventListener('click', open);
      closeBtn?.removeEventListener('click', close);
      backdrop?.removeEventListener('click', close);
      placeBtn?.removeEventListener('click', place);
    };
  }, [cart, navigate, user, placing, isAuthenticated]);

  useEffect(() => {
    const statusEl = document.getElementById('order-status');
    const placeBtn = document.getElementById('place-order-btn');
    if (statusEl && status.message) {
      statusEl.textContent = status.message;
      statusEl.classList.toggle('ck-status--error', status.error);
      statusEl.classList.toggle('ck-status--ok', !status.error);
    }
    if (placeBtn) {
      if (placing) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing…';
      } else if (!cart.length) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Place Online Order';
      } else {
        placeBtn.disabled = false;
        placeBtn.textContent = isAuthenticated && user?.email
          ? 'Place Online Order'
          : 'Place Order';
      }
    }
  }, [status, user, placing, isAuthenticated, cart.length]);

  useEffect(() => {
    const fields = ['customer-name', 'customer-phone', 'customer-address', 'payment-method', 'order-notes'];
    const saved = getLocalJson('cheezka_checkout_form', {});
    fields.forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      if (saved) {
        const key = id.replace('customer-', '').replace('order-', '');
        if (saved[key]) input.value = saved[key];
      }
      const save = () => {
        setLocalJson('cheezka_checkout_form', {
          name: document.getElementById('customer-name')?.value || '',
          phone: document.getElementById('customer-phone')?.value || '',
          address: document.getElementById('customer-address')?.value || '',
          paymentMethod: document.getElementById('payment-method')?.value || 'Cash on Delivery',
          notes: document.getElementById('order-notes')?.value || '',
        });
      };
      const keydown = (e) => {
        if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') e.preventDefault();
      };

      const handleChange = (e) => {
        save();
        if (id === 'payment-method') {
          const detailsDiv = document.getElementById('online-payment-details');
          if (detailsDiv) {
            detailsDiv.style.display = input.value === 'Online Payment' ? 'block' : 'none';
          }
        }
      };

      input.addEventListener('change', handleChange);
      input.addEventListener('input', save);
      input.addEventListener('keydown', keydown);
    });

    const payMethodInput = document.getElementById('payment-method');
    const detailsDiv = document.getElementById('online-payment-details');
    if (payMethodInput && detailsDiv) {
      detailsDiv.style.display = payMethodInput.value === 'Online Payment' ? 'block' : 'none';
    }
  }, [drawerOpen]);
}

// ─────────────────────────────────────────────
// Pages page (Special Deals)
// ─────────────────────────────────────────────
export function usePagesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dealsVersion, setDealsVersion] = useState(0);
  const [dealsList, setDealsList] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadDeals() {
      try {
        const res = await getDeals();
        if (!active) return;
        const deals = res.data || res || [];
        setDealsList(deals);
        const container = document.getElementById('dynamic-deals-container');
        if (!container) return;

        const activeDeals = deals.filter(d => d.isActive);

        if (activeDeals.length === 0) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px;">🎁</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">No Active Deals</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">We don't have any special deals running right now. Keep checking back or view our full menu!</p>
            </div>
          `;
          setLoading(false);
          return;
        }

        let html = '';
        activeDeals.forEach((deal, idx) => {
          const discountText = deal.discount ? `${deal.discount}% OFF` : `Deal ${idx + 1}`;
          let itemsList = '';
          if (deal.products && deal.products.length > 0) {
            itemsList = deal.products.map(p => `<li>${p.name || p.title || p}</li>`).join('');
          } else if (deal.description) {
            const parts = deal.description.split('+');
            itemsList = parts.map(part => `<li>${part.trim()}</li>`).join('');
          }

          html += `
            <div class="col-lg-4 col-md-6 col-12 mb-4">
              <div class="deal-card" style="border-radius:12px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                <img src="${getImageUrl(deal)}" alt="${deal.title || 'Special Deal'}" style="width:100%; height:200px; object-fit:cover;" />
                <div class="deal-top"><h3>${deal.title}</h3><span class="deal-tag">${discountText}</span></div>
                <div class="deal-body">
                  ${deal.products && deal.products.length > 0 && deal.description ? `<p class="deal-desc" style="color:#777; margin-bottom:12px; font-size:0.95rem;">${deal.description}</p>` : ''}
                  ${itemsList ? `<ul class="deal-items" style="list-style:disc; padding-left:20px; margin-bottom:15px;">${itemsList}</ul>` : ''}
                  <div class="deal-price">Rs. ${deal.dealPrice}/-</div>
                  <button class="deal-btn pages-add-deal-btn" data-deal-id="${deal._id}" data-deal-name="${deal.title}" style="border:none; cursor:pointer;" role="button">Order This Deal</button>
                </div>
              </div>
            </div>
          `;
        });

        container.innerHTML = html;
        setLoading(false);
        setDealsVersion(v => v + 1);
      } catch (err) {
        console.error('Error rendering deals page:', err);
        const container = document.getElementById('dynamic-deals-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-5 ck-w-100" style="width: 100%;">
              <div style="font-size: 3rem; margin-bottom: 15px; color:#dc2626;">⚠️</div>
              <h3 style="color:#1B2A49; font-weight:800; font-family:'Nunito Sans',sans-serif;">Error Loading Deals</h3>
              <p style="color:#777; font-size:1.1rem; max-width:500px; margin: 0 auto;">Could not load active deals. Please try reloading the page.</p>
            </div>
          `;
        }
        setLoading(false);
      }
    }

    loadDeals();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;

    const addToCart = (dealId, name, price) => {
      // Clear the cart so only the newly selected deal is shown
      const nextCart = [{ product: dealId, name, size: 'Deal', price, qty: 1 }];
      persistCart(nextCart);
      navigate('/shop?cart=1');
    };

    const buttons = document.querySelectorAll('.pages-add-deal-btn');
    const handlers = [];

    buttons.forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dealId = btn.getAttribute('data-deal-id');
        const name = btn.getAttribute('data-deal-name');

        const deal = dealsList.find(d => d._id === dealId);
        if (!deal) return;

        const price = deal.dealPrice || 0;
        addToCart(dealId, name, price);
      };

      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [dealsVersion, loading, dealsList, navigate]);
}

// ─────────────────────────────────────────────
// Home page (Featured Products)
// ─────────────────────────────────────────────
export function useHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [homeVersion, setHomeVersion] = useState(0);
  const [productsList, setProductsList] = useState([]);
  const [cart, setCartState] = useState(() => getCart());

  const updateCart = (updater) => {
    setCartState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistCart(next);
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    async function loadHomeProducts() {
      let products = [];
      try {
        const prodRes = await getProducts();
        products = prodRes.data || prodRes || [];
      } catch (e) {
        console.warn('Backend API unavailable, displaying featured menu fallback products');
      }

        if (!active) return;

        const container = document.getElementById('dynamic-home-products');
        if (!container) return;

        let displayProds = Array.isArray(products) ? products.filter(p => p.isActive && p.category && p.category.name !== 'Drinks').slice(0, 6) : [];

        if (displayProds.length === 0) {
          // Display 4-6 featured fallback products from our Pizza Zone menu dataset
          displayProds = PIZZA_ZONE_FALLBACK_PRODUCTS.slice(0, 6);
        }

        setProductsList(displayProds);

        let html = '';
        displayProds.forEach(prod => {
          const hasSizes = prod.sizes && prod.sizes.length > 0;
          let priceText = '';
          if (hasSizes) {
            const prices = prod.sizes.map(s => s.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceText = minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
          } else {
            priceText = `${prod.basePrice || 350}`;
          }

          html += `
            <div class="col-lg-4 col-md-4 col-sm-6 productsubtitlenone product text-center mb-4">   
              <a href="/shop" class="woocommerce-LoopProduct-link woocommerce-loop-product__link"> 
                <div class="wrappimage" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 12px;">
                  <img decoding="async" width="500" height="500" src="${getImageUrl(prod)}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="${prod.name}" style="height: 240px; object-fit: cover; width: 100%;" />
                </div>
                <div class="star-rating" role="img" aria-label="Rated 5.00 out of 5"><span class="ck-w-100">Rated <strong class="rating">5.00</strong> out of 5</span></div>
                <h2 class="woocommerce-loop-product__title" style="font-family:'Nunito Sans',sans-serif; font-weight: 800; color:#1b2a49; font-size: 1.25rem;">${prod.name}</h2>
                <span class="productsubtitle" style="font-size:0.9rem; color:#666; min-height:40px; display:block; margin: 6px 0;">${prod.description || 'Delicious freshly prepared item'}</span>
                <span class="price" style="font-size: 1.2rem; font-weight: 800; color: #007B99;">
                  <span class="woocommerce-Price-amount amount">
                    <bdi><span class="woocommerce-Price-currencySymbol">Rs. </span>${priceText}</bdi>
                  </span>
                </span>
              </a>
              <button class="button product_type_simple add_to_cart_button ajax_add_to_cart homepage-add-to-cart" 
                      data-product-id="${prod._id}" 
                      data-product-name="${prod.name}"
                      style="border:none; cursor:pointer; background: #007B99; color: #fff; font-weight: 800; border-radius: 20px; padding: 8px 20px; margin-top: 10px;"
                      role="button">Add to cart</button>
            </div>
          `;
        });

        container.innerHTML = html;
        setLoading(false);
        setHomeVersion(v => v + 1);
    }

    loadHomeProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading) return;

    const addToCart = (productId, name, size, price) => {
      updateCart((prev) => {
        const found = prev.find((item) => item.name === name && item.size === size && item.price === price);
        if (found) {
          return prev.map((item) => (item === found ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { product: productId, name, size, price, qty: 1 }];
      });
      navigate('/shop?cart=1');
    };

    const buttons = document.querySelectorAll('.homepage-add-to-cart');
    const handlers = [];

    buttons.forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute('data-product-id');
        const name = btn.getAttribute('data-product-name');

        const prod = productsList.find(p => p._id === productId);
        if (!prod) return;

        let size = 'Regular';
        let price = prod.basePrice || 0;

        if (prod.sizes && prod.sizes.length > 0) {
          size = prod.sizes[0].size;
          price = prod.sizes[0].price;
        }

        addToCart(productId, name, size, price);
      };

      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [homeVersion, loading, productsList, navigate]);
}

