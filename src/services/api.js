// API Service Layer - Centralized API calls to backend
const API_BASE = 'http://localhost:3000/api';

// Helper function for authenticated requests
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Helper function for requests without auth
async function fetchWithoutAuth(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ AUTH API ============
export const authAPI = {
  login: (email, password) =>
    fetchWithoutAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    fetchWithoutAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  syncUser: (userData) =>
    fetchWithoutAuth('/auth/sync-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: () => fetchWithAuth('/auth/profile'),

  isLoggedIn: () => !!localStorage.getItem('token'),
};

// ============ RESTAURANT API ============
// Public endpoints - no authentication required for browsing
export const restaurantAPI = {
  getAll: () => fetchWithoutAuth('/restaurants'),

  getById: (id) => fetchWithoutAuth(`/restaurants/${id}`),

  getCategories: (restaurantId) =>
    fetchWithoutAuth(`/restaurants/${restaurantId}/categories`),

  getItems: (restaurantId) =>
    fetchWithoutAuth(`/restaurants/${restaurantId}/items`),

  getFloorPlan: (restaurantId) =>
    fetchWithoutAuth(`/restaurants/${restaurantId}/floor-plan`),
};

// ============ MENU API ============
export const menuAPI = {
  getCategories: (restaurantId) =>
    fetchWithoutAuth(`/restaurants/${restaurantId}/categories`),

  getItems: (restaurantId) =>
    fetchWithoutAuth(`/restaurants/${restaurantId}/items`),
};

// ============ RESERVATION API ============
export const reservationAPI = {
  create: (reservationData) =>
    fetchWithAuth('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    }),

  update: (id, data) =>
    fetchWithAuth(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getById: (id) => fetchWithAuth(`/reservations/${id}`),

  getUserReservations: () => fetchWithAuth('/reservations'),

  // Request cancellation
  requestCancellation: (id, reason) =>
    fetchWithAuth(`/reservations/${id}/request-cancellation`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============ NOTIFICATION API ============
export const notificationAPI = {
  getNotifications: () => fetchWithAuth('/notifications'),

  getNotificationCount: () => fetchWithAuth('/notifications/count'),

  markNotificationRead: (notificationId) =>
    fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: () =>
    fetchWithAuth('/notifications/read-all', {
      method: 'PUT',
    }),

  deleteNotification: (notificationId) =>
    fetchWithAuth(`/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};

// ============ CART API ============
export const cartAPI = {
  getCart: () => fetchWithAuth('/cart'),

  addItem: (itemData) =>
    fetchWithAuth('/cart/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  removeItem: (itemId) =>
    fetchWithAuth(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  updateItemQuantity: (itemId, quantity) =>
    fetchWithAuth(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  clearCart: (cartId) =>
    fetchWithAuth(`/cart/${cartId}`, {
      method: 'DELETE',
    }),
};

// ============ ORDER API ============
export const orderAPI = {
  create: (orderData) =>
    fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getById: (id) => fetchWithAuth(`/orders/${id}`),

  getUserOrders: () => fetchWithAuth('/orders'),

  getRestaurantOrders: (restaurantId) =>
    fetchWithAuth(`/restaurants/${restaurantId}/orders`),

  updateStatus: (orderId, status) =>
    fetchWithAuth(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ============ STAFF API ============
// Helper function for staff authenticated requests
async function fetchStaffWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('staffToken');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const staffAPI = {
  login: (email, password) =>
    fetchWithoutAuth('/staff/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getOrders: () =>
    fetchStaffWithAuth('/staff/orders'),

  getReservations: () =>
    fetchStaffWithAuth('/staff/reservations'),

  updateOrderStatus: (orderId, status) =>
    fetchStaffWithAuth(`/staff/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateReservationStatus: (reservationId, status) =>
    fetchStaffWithAuth(`/staff/reservations/${reservationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Approve cancellation request
  approveCancellation: (reservationId) =>
    fetchStaffWithAuth(`/staff/reservations/${reservationId}/approve-cancellation`, {
      method: 'POST',
    }),

  // Reject cancellation request
  rejectCancellation: (reservationId) =>
    fetchStaffWithAuth(`/staff/reservations/${reservationId}/reject-cancellation`, {
      method: 'POST',
    }),

  getStats: () =>
    fetchStaffWithAuth('/staff/stats'),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    fetchStaffWithAuth(`/staff/notifications${unreadOnly ? '?unread_only=true' : ''}`),

  getNotificationCount: () =>
    fetchStaffWithAuth('/staff/notifications/count'),

  markNotificationRead: (notificationId) =>
    fetchStaffWithAuth(`/staff/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: () =>
    fetchStaffWithAuth('/staff/notifications/read-all', {
      method: 'PUT',
    }),

  deleteNotification: (notificationId) =>
    fetchStaffWithAuth(`/staff/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};

// ============ ADMIN API ============
// Helper function for admin authenticated requests
async function fetchAdminWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('adminToken');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || `HTTP ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    console.error(`API Error [${endpoint}]:`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

export const adminAPI = {
  login: (email, password) =>
    fetchWithoutAuth('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getStats: () => fetchAdminWithAuth('/admin/stats'),

  getAllOrders: (status) => {
    const url = status ? `/admin/orders?status=${status}` : '/admin/orders';
    return fetchAdminWithAuth(url);
  },

  getAllReservations: () => fetchAdminWithAuth('/admin/reservations'),

  // Restaurant management
  getAllRestaurants: () => fetchAdminWithAuth('/admin/restaurants'),

  createRestaurant: (data) =>
    fetchAdminWithAuth('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRestaurant: (id, data) =>
    fetchAdminWithAuth(`/admin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRestaurant: (id) =>
    fetchAdminWithAuth(`/admin/restaurants/${id}`, {
      method: 'DELETE',
    }),

  // Staff management
  getAllStaff: () => fetchAdminWithAuth('/admin/staff'),

  createStaff: (data) =>
    fetchAdminWithAuth('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStaff: (id, data) =>
    fetchAdminWithAuth(`/admin/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStaff: (id) =>
    fetchAdminWithAuth(`/admin/staff/${id}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalyticsOverview: (period = 'month') =>
    fetchAdminWithAuth(`/admin/analytics/overview?period=${period}`),

  getTopRestaurants: (period = 'month', limit = 10) =>
    fetchAdminWithAuth(`/admin/analytics/top-restaurants?period=${period}&limit=${limit}`),

  getPeakHours: (period = 'month') =>
    fetchAdminWithAuth(`/admin/analytics/peak-hours?period=${period}`),

  getRecentReservations: (limit = 20) =>
    fetchAdminWithAuth(`/admin/analytics/recent-reservations?limit=${limit}`),

  getRevenueByDay: (days = 30) =>
    fetchAdminWithAuth(`/admin/analytics/revenue-by-day?days=${days}`),
};

// ============ PAYMENT API ============
export const paymentAPI = {
  create: (paymentData) =>
    fetchWithAuth('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  getUserPayments: () => fetchWithAuth('/payments'),
};
