import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminRequests from './pages/AdminRequests.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import RequestedMeals from './pages/RequestedMeals.jsx';
import { getStoredAuth, clearAuth } from './services/auth';

const Layout = ({ children }) => {
  const auth = getStoredAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              🏛
            </div>
            <span className="font-bold text-slate-800 text-lg">Prasadam Portal</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {auth && auth.user?.role === 'admin' && (
              <Link to="/admin" className="text-slate-600 hover:text-blue-600 font-medium transition">
                📊 Admin
              </Link>
            )}
            {auth && auth.user?.role === 'user' && (
              <>
                <Link to="/user" className="text-slate-600 hover:text-blue-600 font-medium transition">
                  🍽️ Book Meal
                </Link>
                <Link to="/meals" className="text-slate-600 hover:text-blue-600 font-medium transition">
                  📋 My Meals
                </Link>
              </>
            )}
            {auth ? (
              <>
                <span className="text-slate-500 text-xs">
                  👤 {auth.user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
          © 2026 Temple Meals — {new Date().toLocaleDateString()}
        </div>
      </footer>
    </div>
  );
};

const ProtectedRoute = ({ children, role }) => {
  const auth = getStoredAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.user?.role !== role) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-requests"
          element={
            <ProtectedRoute role="admin">
              <AdminRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals"
          element={
            <ProtectedRoute role="user">
              <RequestedMeals />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

