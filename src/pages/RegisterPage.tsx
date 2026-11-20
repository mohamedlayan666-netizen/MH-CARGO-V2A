import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Package, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/domain';
import { EGYPT_GOVERNORATES } from '../lib/constants';

export const RegisterPage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, authReady, signInWithGoogle, registerProfile } =
    useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('shipper');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('الإسكندرية');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (firebaseUser && !displayName) {
      setDisplayName(firebaseUser.displayName || '');
    }
  }, [firebaseUser, displayName]);

  useEffect(() => {
    if (!authReady) return;
    if (profile) {
      navigate(profile.role === 'carrier' ? '/carrier' : '/shipper', { replace: true });
    } else if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authReady, profile, isAdmin, navigate]);

  const handleGoogleConnect = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('تعذر ربط حساب Google. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firebaseUser) {
      setError('يرجى المصادقة بحساب Google أولاً ثم استكمال بيانات الحساب.');
      return;
    }

    if (displayName.trim().length < 2 || companyName.trim().length < 2 || phone.trim().length < 5) {
      setError('يرجى إدخال الاسم الكامل، اسم الشركة، ورقم الهاتف بشكل صحيح.');
      return;
    }

    if (!acceptedTerms) {
      setError('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية قبل إنشاء الحساب.');
      return;
    }

    setLoading(true);
    try {
      await registerProfile({
        displayName,
        companyName,
        phone,
        role,
        city,
        commercialRegister,
      });
      navigate(role === 'carrier' ? '/carrier' : '/shipper', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الحساب. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-orange-600 mb-2">حساب جديد</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mb-2">
              إنشاء حساب في منصة MH CARGO
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              اختر نوع الحساب (صاحب شحنة أو ناقل) وأكمل بيانات شركتك للبدء في استخدام المنصة.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Google Auth Connection */}
          <div className="mb-8 pb-6 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-3">
              الخطوة 01 · توثيق الهوية الإلكترونية
            </p>
            {firebaseUser ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      تم الربط بحساب: {firebaseUser.email}
                    </p>
                    <p className="text-xs text-slate-500">أكمل بيانات النشاط بالأسفل لحفظ الحساب</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={loading}
                className="w-full py-3.5 px-5 bg-slate-950 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {loading ? 'جارٍ الاتصال...' : 'المتابعة وتوثيق البريد عبر Google'}
              </button>
            )}
          </div>

          {/* Step 2: Role Selection & Business Details */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-3">
                الخطوة 02 · نوع الحساب
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('shipper')}
                  className={`p-4 rounded-xl border text-right transition-colors cursor-pointer ${
                    role === 'shipper'
                      ? 'border-orange-600 bg-orange-50/40'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Package className={`w-5 h-5 ${role === 'shipper' ? 'text-orange-600' : 'text-slate-600'}`} />
                    <span className="font-display text-base font-bold text-slate-950">
                      صاحب شحنة
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    للمستوردين، المصدرين، المصانع، والمستخلصين لطلب نقل الحاويات واستقبال عروض الأسعار.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('carrier')}
                  className={`p-4 rounded-xl border text-right transition-colors cursor-pointer ${
                    role === 'carrier'
                      ? 'border-orange-600 bg-orange-50/40'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Truck className={`w-5 h-5 ${role === 'carrier' ? 'text-orange-600' : 'text-slate-600'}`} />
                    <span className="font-display text-base font-bold text-slate-950">
                      ناقل / صاحب شاحنة
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    لشركات النقل وأصحاب الجرارات لتسجيل الأسطول وتقديم عروض الأسعار وتنفيذ الرحلات.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الاسم الكامل للمسؤول
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="الاسم الثلاثي"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اسم الشركة أو المؤسسة
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="شركة النيل للتجارة / النقل"
                    className="w-full pr-9 pl-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رقم الهاتف للتواصل
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01000000000"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  المحافظة / المقر
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  السجل التجاري (اختياري)
                </label>
                <input
                  type="text"
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  placeholder="رقم السجل"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                أوافق على{' '}
                <Link to="/terms" className="text-orange-600 font-semibold hover:underline">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link to="/privacy" className="text-orange-600 font-semibold hover:underline">
                  سياسة الخصوصية
                </Link>{' '}
                الخاصة بمنصة MH CARGO.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !firebaseUser}
              className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'جارٍ إنشاء الحساب...' : 'تأكيد إنشاء الحساب والانتقال للوحة التحكم'}
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600">
            لديك حساب مسجل بالفعل؟{' '}
            <Link to="/login" className="font-semibold text-slate-950 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
