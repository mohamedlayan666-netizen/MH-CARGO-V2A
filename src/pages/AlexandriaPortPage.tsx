import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ASSET_IMAGES, PORT_GATES } from '../lib/constants';
import { ResilientImage } from '../components/ResilientImage';

export const AlexandriaPortPage: React.FC = () => {
  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-12">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-semibold text-orange-600 mb-2">نطاق التشغيل الأول · الميناء الأول</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
              عمليات نقل الحاويات في ميناء الإسكندرية
            </h1>
            <p className="text-base text-slate-600 leading-relaxed mb-6">
              يُعد ميناء الإسكندرية المنفذ البحري الرئيسي لحركة الواردات والصادرات المصرية. توفر منصة MH CARGO تنسيقاً مباشراً لدخول وخروج الجرارات والشاحنات المجهزة عبر البوابات المعتمدة ومحطات الحاويات الرئيسية.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shipments/new?port=alexandria"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <span>طلب نقل من/إلى ميناء الإسكندرية</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/ports/dekheila"
                className="inline-flex items-center px-5 py-3 border border-slate-300 hover:border-slate-950 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
              >
                عرض ميناء الدخيلة
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px]">
            <ResilientImage
              src={ASSET_IMAGES.alexandriaPort}
              alt="محطة حاويات ميناء الإسكندرية"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-4">
              البوابات والمحطات المشمولة بالخدمة
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {PORT_GATES.alexandria.map((gate, i) => (
                <li key={gate} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="font-mono text-orange-600 ml-2">0{i + 1}.</span>
                  {gate}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-4">
              خطوط التوصيل النشطة من الإسكندرية
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                تشمل حركة النقل المتاحة على المنصة التوصيل السريع داخل نطاق محافظة الإسكندرية (برج العرب، العامرية، مرغم، المنشية الجديدة) وكذلك الخطوط الطويلة نحو:
              </p>
              <p className="text-slate-900 font-medium">
                القاهرة الكبرى · العاشر من رمضان · السادس من أكتوبر · مدينة السادات · العبور · دمياط · الدلتا وصعيد مصر.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
