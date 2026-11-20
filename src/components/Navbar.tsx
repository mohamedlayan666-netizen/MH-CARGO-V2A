import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { firebaseUser, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/services', label: 'خدماتنا' },
    { to: '/ports/alexandria', label: 'ميناء الإسكندرية' },
    { to: '/ports/dekheila', label: 'ميناء الدخيلة' },
    { to: '/how-it-works', label: 'كيف تعمل المنصة؟' },
  ];

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (profile?.role === 'carrier') return '/carrier';
    if (profile?.role === 'shipper') return '/shipper';
    return '/register';
  };

  const getPrimaryActionLabel = () => {
    if (!firebaseUser) return 'دخول / تسجيل';
    if (isAdmin) return 'لوحة الإدارة';
    if (profile?.role === 'carrier') return 'لوحة الناقل';
    if (profile?.role === 'shipper') return 'لوحة الشاحن';
    return 'إكمال الحساب';
  };

  const handlePrimaryAction = () => {
    setMobileOpen(false);
    if (!firebaseUser) {
      navigate('/login');
    } else {
      navigate(getDashboardPath());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-extrabold tracking-tight text-slate-950 whitespace-nowrap shrink-0"
        >
          MH CARGO
        </Link>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'text-slate-950 border-orange-600 font-semibold'
                    : 'border-transparent hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {getPrimaryActionLabel()}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="lg:hidden p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            من نحن
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            اتصل بنا
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full py-2.5 px-4 bg-slate-950 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
            >
              {getPrimaryActionLabel()}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
