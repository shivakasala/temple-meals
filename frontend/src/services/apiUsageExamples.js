/**
 * API Usage Examples
 * 
 * This file demonstrates how to use the API endpoints in your React components.
 */

import apiEndpoints from './apiEndpoints';
import { setAuthToken, removeAuthToken } from './auth';

// ============================================
// AUTHENTICATION EXAMPLES
// ============================================

// Example: Login
const handleLogin = async (username, password) => {
  try {
    const data = await apiEndpoints.auth.login(username, password);
    // data = { token, user: { id, username, role, templeName } }
    
    setAuthToken(data.token);
    console.log('Logged in user:', data.user);
    return data.user;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
    throw error;
  }
};

// Example: Get current user
const getCurrentUser = async () => {
  try {
    const data = await apiEndpoints.auth.me();
    return data.user;
  } catch (error) {
    console.error('Failed to get user:', error);
    removeAuthToken();
    throw error;
  }
};

// Example: Bootstrap first admin (one-time setup)
const bootstrapFirstAdmin = async () => {
  try {
    const data = await apiEndpoints.auth.bootstrapAdmin(
      'admin',
      'password123',
      'Main Temple'
    );
    console.log('Admin created:', data);
    return data;
  } catch (error) {
    console.error('Bootstrap failed:', error.response?.data?.message);
    throw error;
  }
};

// ============================================
// USER MANAGEMENT EXAMPLES (Admin only)
// ============================================

// Example: Create new user
const createNewUser = async (username, password, templeName, role = 'user') => {
  try {
    const user = await apiEndpoints.user.createUser(
      username,
      password,
      templeName,
      role
    );
    console.log('User created:', user);
    return user;
  } catch (error) {
    console.error('Failed to create user:', error.response?.data?.message);
    throw error;
  }
};

// Example: Get all users
const fetchAllUsers = async () => {
  try {
    const users = await apiEndpoints.user.listUsers();
    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

// Example: Update user
const updateExistingUser = async (userId, updates) => {
  try {
    const updatedUser = await apiEndpoints.user.updateUser(userId, {
      templeName: updates.templeName,
      role: updates.role,
      password: updates.password // optional
    });
    console.log('User updated:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
};

// Example: Delete user
const deleteExistingUser = async (userId) => {
  try {
    const result = await apiEndpoints.user.deleteUser(userId);
    console.log('User deleted:', result);
    return result;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
};

// ============================================
// MEAL REQUEST EXAMPLES
// ============================================

// Example: Create single-day meal request
const createSingleDayRequest = async () => {
  try {
    const meal = await apiEndpoints.meal.createMealRequest({
      morningPrasadam: 2,
      eveningPrasadam: 3,
      userPhone: '1234567890',
      userTemple: 'Main Temple',
      category: 'IOS' // or 'General'
    });
    console.log('Meal request created:', meal);
    return meal;
  } catch (error) {
    console.error('Failed to create meal request:', error.response?.data?.message);
    throw error;
  }
};

// Example: Create multi-day meal request
const createMultiDayRequest = async (fromDate, toDate) => {
  try {
    const meals = await apiEndpoints.meal.createMealRequest({
      morningPrasadam: 2,
      eveningPrasadam: 1,
      userPhone: '1234567890',
      userTemple: 'Main Temple',
      category: 'IOS',
      fromDate: fromDate, // 'YYYY-MM-DD'
      toDate: toDate      // 'YYYY-MM-DD'
    });
    console.log('Multi-day requests created:', meals);
    return meals;
  } catch (error) {
    console.error('Failed to create multi-day request:', error.response?.data?.message);
    throw error;
  }
};

// Example: Get my meal requests
const getMyMealRequests = async (date = null) => {
  try {
    const meals = await apiEndpoints.meal.getMyMeals(date);
    // meals will have editingAllowed property calculated by backend
    return meals;
  } catch (error) {
    console.error('Failed to get meals:', error);
    throw error;
  }
};

// Example: Update meal request (within 10 minutes of creation)
const updateMealRequest = async (mealId) => {
  try {
    const updatedMeal = await apiEndpoints.meal.updateMealRequest(
      mealId,
      3, // morningPrasadam
      2  // eveningPrasadam
    );
    console.log('Meal updated:', updatedMeal);
    return updatedMeal;
  } catch (error) {
    console.error('Failed to update meal:', error.response?.data?.message);
    throw error;
  }
};

// Example: Mark payment as done
const markPaymentDone = async (mealId) => {
  try {
    const meal = await apiEndpoints.meal.markPaid(mealId);
    console.log('Payment marked:', meal);
    return meal;
  } catch (error) {
    console.error('Failed to mark payment:', error);
    throw error;
  }
};

// ============================================
// ADMIN MEAL MANAGEMENT EXAMPLES
// ============================================

// Example: Get all meals with filters
const getAdminMeals = async (date = null, userId = null) => {
  try {
    const filters = {};
    if (date) filters.date = date;
    if (userId) filters.userId = userId;
    
    const meals = await apiEndpoints.meal.adminGetMeals(filters);
    return meals;
  } catch (error) {
    console.error('Failed to get admin meals:', error);
    throw error;
  }
};

// Example: Approve/reject meal request
const approveMealRequest = async (mealId) => {
  try {
    const meal = await apiEndpoints.meal.adminUpdateMealStatus(
      mealId,
      'approved' // or 'rejected' or 'requested'
    );
    console.log('Meal status updated:', meal);
    return meal;
  } catch (error) {
    console.error('Failed to update meal status:', error);
    throw error;
  }
};

// Example: Approve payment
const approvePayment = async (mealId) => {
  try {
    const meal = await apiEndpoints.meal.adminUpdatePaymentStatus(
      mealId,
      'payment-approved' // or 'pending' or 'paid'
    );
    console.log('Payment status updated:', meal);
    return meal;
  } catch (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }
};

// Example: Get admin summary
const getAdminSummary = async (date = null) => {
  try {
    const summary = await apiEndpoints.meal.adminGetSummary(date);
    // summary = { daily: [...], totalCollected: number }
    return summary;
  } catch (error) {
    console.error('Failed to get summary:', error);
    throw error;
  }
};

// Example: Get daily report
const getDailyReport = async (date) => {
  try {
    const report = await apiEndpoints.meal.adminGetReport(date);
    // report = { date, items: [...] }
    return report;
  } catch (error) {
    console.error('Failed to get report:', error);
    throw error;
  }
};

// ============================================
// SETTINGS EXAMPLES
// ============================================

// Example: Get current rates
const getCurrentRates = async () => {
  try {
    const rates = await apiEndpoints.settings.getRates();
    // rates = { morningRate: number, eveningRate: number }
    return rates;
  } catch (error) {
    console.error('Failed to get rates:', error);
    throw error;
  }
};

// Example: Update rates (admin only)
const updateRates = async (morningRate, eveningRate) => {
  try {
    const settings = await apiEndpoints.settings.updateRates(
      morningRate,
      eveningRate
    );
    console.log('Rates updated:', settings);
    return settings;
  } catch (error) {
    console.error('Failed to update rates:', error);
    throw error;
  }
};

// ============================================
// HEALTH CHECK EXAMPLE
// ============================================

const checkBackendHealth = async () => {
  try {
    const health = await apiEndpoints.healthCheck();
    console.log('Backend health:', health);
    return health;
  } catch (error) {
    console.error('Backend is down:', error);
    throw error;
  }
};

// Export examples (for reference only)
export {
  handleLogin,
  getCurrentUser,
  bootstrapFirstAdmin,
  createNewUser,
  fetchAllUsers,
  updateExistingUser,
  deleteExistingUser,
  createSingleDayRequest,
  createMultiDayRequest,
  getMyMealRequests,
  updateMealRequest,
  markPaymentDone,
  getAdminMeals,
  approveMealRequest,
  approvePayment,
  getAdminSummary,
  getDailyReport,
  getCurrentRates,
  updateRates,
  checkBackendHealth
};
