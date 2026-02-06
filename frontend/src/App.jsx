import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
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
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Temple Meals</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {auth && auth.user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-blue-600">
                Admin Dashboard
              </Link>
            )}
            {auth && auth.user?.role === 'user' && (
              <Link to="/user" className="hover:text-blue-600">
                My Requests
              </Link>
            )}
            {auth ? (
              <>
                <span className="text-slate-500">
                  {auth.user.username} ({auth.user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded bg-slate-800 text-white text-xs hover:bg-slate-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded bg-slate-800 text-white text-xs hover:bg-slate-900"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
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
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

