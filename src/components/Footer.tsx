import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand summary */}
          <div>
            <div className="font-display text-2xl font-extrabold text-white mb-3">
              MH CARGO
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              منصة ذكية لنقل الحاويات تربط أصحاب الشحنات بشركات النقل وأصحاب الشاحنات والجرارات داخل مصر، مع تركيز تشغيلي مباشر على ميناء الإسكندرية وميناء الدخيلة.
            </p>
            <p className="text-xs text-slate-400">
              نطاق التشغيل الأول: الإسكندرية · الدخيلة · جميع المحافظات
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4">
              المنصة والخدمات
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-orange-400 transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-orange-400 transition-colors">
                  خدماتنا اللوجستية
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-orange-400 transition-colors">
                  كيف تعمل المنصة؟
                </Link>
              </li>
              <li>
                <Link to="/shipments/new" className="hover:text-orange-400 transition-colors">
                  طلب نقل حاوية جديد
                </Link>
              </li>
            </ul>
          </div>

          {/* Ports & Accounts */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4">
              الموانئ والحسابات
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/ports/alexandria" className="hover:text-orange-400 transition-colors">
                  ميناء الإسكندرية
                </Link>
              </li>
              <li>
                <Link to="/ports/dekheila" className="hover:text-orange-400 transition-colors">
                  ميناء الدخيلة
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-orange-400 transition-colors">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-orange-400 transition-colors">
                  إنشاء حساب جديد
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-display text-sm font-bold text-white mb-4">
              الدعم والسياسات
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="hover:text-orange-400 transition-colors">
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-orange-400 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-orange-400 transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
            </ul>
            <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <p>مقر العمليات: الإسكندرية، جمهورية مصر العربية</p>
              <p dir="ltr" className="text-right font-mono">
                operations@mhcargo.eg
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MH CARGO. جميع الحقوق محفوظة.</p>
          <p>منصة رقمية متخصصة في نقل الحاويات — الإصدار الثاني</p>
        </div>
      </div>
    </footer>
  );
};
