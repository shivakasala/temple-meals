import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminRequests from './pages/AdminRequests.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import RequestedMeals from './pages/RequestedMeals.jsx';
import { getStoredAuth, clearAuth } from './services/auth';

const Layout = ({ children }) => {
  const auth = getStoredAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 no-underline ${
      isActive
        ? 'bg-saffron-50 text-saffron-700'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to={auth?.user?.role === 'admin' ? '/admin' : '/user'}
            className="flex items-center gap-2.5 no-underline hover:no-underline shrink-0"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-saffron-400 to-saffron-600 rounded-lg flex items-center justify-center text-white text-lg shadow-sm">
              🏛
            </div>
            <span className="font-bold text-slate-800 text-base tracking-tight">
              Prasadam Portal
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {auth && auth.user?.role === 'admin' && (
              <>
                <NavLink to="/admin" className={navLinkClass} end>
                  Dashboard
                </NavLink>
                <NavLink to="/admin-requests" className={navLinkClass}>
                  Requests
                </NavLink>
              </>
            )}
            {auth && auth.user?.role === 'user' && (
              <>
                <NavLink to="/user" className={navLinkClass}>
                  Book Meal
                </NavLink>
                <NavLink to="/meals" className={navLinkClass}>
                  My Requests
                </NavLink>
              </>
            )}
            {auth ? (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-saffron-100 flex items-center justify-center text-xs font-bold text-saffron-700 uppercase">
                    {auth.user.username.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">
                    {auth.user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary btn-sm no-underline hover:no-underline ml-2"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          {auth && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Nav */}
        {auth && mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {auth.user?.role === 'admin' && (
              <>
                <NavLink to="/admin" className={navLinkClass} end onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin-requests" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Requests
                </NavLink>
              </>
            )}
            {auth.user?.role === 'user' && (
              <>
                <NavLink to="/user" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Book Meal
                </NavLink>
                <NavLink to="/meals" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  My Requests
                </NavLink>
              </>
            )}
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-saffron-100 flex items-center justify-center text-xs font-bold text-saffron-700 uppercase">
                  {auth.user.username.charAt(0)}
                </div>
                <span className="text-sm text-slate-600 font-medium">{auth.user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Temple Prasadam Portal
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
