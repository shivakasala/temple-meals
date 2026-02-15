import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminRequests from './pages/AdminRequests.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import RequestedMeals from './pages/RequestedMeals.jsx';

const Layout = ({ children }) => {
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
            <Link to="/admin" className="text-slate-600 hover:text-blue-600 font-medium transition">
              📊 Admin
            </Link>
            <Link to="/user" className="text-slate-600 hover:text-blue-600 font-medium transition">
              🍽️ Book Meal
            </Link>
            <Link to="/meals" className="text-slate-600 hover:text-blue-600 font-medium transition">
              📋 My Meals
            </Link>
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

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-requests" element={<AdminRequests />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/meals" element={<RequestedMeals />} />
        <Route path="/" element={<Navigate to="/user" replace />} />
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </Layout>
  );
}

