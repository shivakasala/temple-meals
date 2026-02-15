import api from './api';

// ============================================
// AUTH ENDPOINTS (/api/auth)
// ============================================

export const authApi = {
  // Bootstrap first admin user
  bootstrapAdmin: async (username, password, templeName) => {
    const response = await api.post('/auth/bootstrap-admin', {
      username,
      password,
      templeName
    });
    return response.data;
  },

  // Login
  login: async (username, password) => {
    const response = await api.post('/auth/login', {
      username,
      password
    });
    return response.data;
  },

  // Get current user profile
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// ============================================
// USER ENDPOINTS (/api/users) - Admin only
// ============================================

export const userApi = {
  // Create new user
  createUser: async (username, password, templeName, role = 'user') => {
    const response = await api.post('/users', {
      username,
      password,
      templeName,
      role
    });
    return response.data;
  },

  // List all users
  listUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Update user
  updateUser: async (userId, updates) => {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

// ============================================
// MEAL ENDPOINTS (/api/meals)
// ============================================

export const mealApi = {
  // Create meal request (single day or date range)
  createMealRequest: async (requestData) => {
    const response = await api.post('/meals', requestData);
    return response.data;
  },

  // Get current user's meal requests (optionally by date)
  getMyMeals: async (date = null) => {
    const params = date ? { date } : {};
    const response = await api.get('/meals/mine', { params });
    return response.data;
  },

  // Update own meal request (within 10 minutes)
  updateMealRequest: async (mealId, morningPrasadam, eveningPrasadam) => {
    const response = await api.put(`/meals/${mealId}`, {
      morningPrasadam,
      eveningPrasadam
    });
    return response.data;
  },

  // Mark payment as done
  markPaid: async (mealId) => {
    const response = await api.post(`/meals/${mealId}/mark-paid`);
    return response.data;
  },

  // Admin: List all meals with optional filters
  adminGetMeals: async (filters = {}) => {
    const response = await api.get('/meals/admin', { params: filters });
    return response.data;
  },

  // Admin: Get all meals
  adminGetAllMeals: async () => {
    const response = await api.get('/meals');
    return response.data;
  },

  // Admin: Update meal status (approve/reject)
  adminUpdateMealStatus: async (mealId, status) => {
    const response = await api.post(`/meals/${mealId}/admin-meal-status`, {
      status
    });
    return response.data;
  },

  // Admin: Update payment status
  adminUpdatePaymentStatus: async (mealId, status) => {
    const response = await api.post(`/meals/${mealId}/admin-payment-status`, {
      status
    });
    return response.data;
  },

  // Admin: Get summary (totals per day, total amount collected)
  adminGetSummary: async (date = null) => {
    const params = date ? { date } : {};
    const response = await api.get('/meals/admin-summary', { params });
    return response.data;
  },

  // Admin: Get daily report
  adminGetReport: async (date) => {
    const response = await api.get('/meals/admin-report', { params: { date } });
    return response.data;
  },

  // Email-based approval (accessed via email link)
  approveViaEmail: async (mealId, token) => {
    const response = await api.get(`/meals/${mealId}/approve`, {
      params: { token }
    });
    return response.data;
  },

  // Email-based rejection (accessed via email link)
  rejectViaEmail: async (mealId, token) => {
    const response = await api.get(`/meals/${mealId}/reject`, {
      params: { token }
    });
    return response.data;
  }
};

// ============================================
// SETTINGS ENDPOINTS (/api/settings)
// ============================================

export const settingsApi = {
  // Get current rates (authenticated users)
  getRates: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Admin: Create/update rates
  updateRates: async (morningRate, eveningRate) => {
    const response = await api.post('/settings', {
      morningRate,
      eveningRate
    });
    return response.data;
  }
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Export all as default
export default {
  auth: authApi,
  user: userApi,
  meal: mealApi,
  settings: settingsApi,
  healthCheck
};
