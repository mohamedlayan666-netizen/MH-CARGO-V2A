import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, authReady, needsRegistration, signInWithGoogle } =
    useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (profile?.role === 'shipper') {
      navigate('/shipper', { replace: true });
    } else if (profile?.role === 'carrier') {
      navigate('/carrier', { replace: true });
    } else if (needsRegistration) {
      navigate('/register', { replace: true });
    }
  }, [authReady, firebaseUser, profile, isAdmin, needsRegistration, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setError('تم إغلاق نافذة تسجيل الدخول قبل الإتمام.');
      } else {
        setError('تعذر تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 py-16 lg:py-24">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-orange-600 mb-2">بوابة الدخول الآمن</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mb-2">
              تسجيل الدخول إلى MH CARGO
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              ادخل إلى لوحة الشاحن، لوحة الناقل، أو لوحة الإدارة باستخدام حسابك الموثق.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-slate-950 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>{loading ? 'جارٍ التحقق...' : 'المتابعة بحساب Google'}</span>
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                يتم التحقق من البريد الإلكتروني تلقائياً وعزل بيانات أصحاب الشحنات والناقلين وفق صلاحيات قاعدة البيانات.
              </p>
            </div>
            <p className="text-xs text-slate-600">
              ليس لديك حساب على المنصة بعد؟{' '}
              <Link to="/register" className="font-semibold text-orange-600 hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
