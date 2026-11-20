import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ASSET_IMAGES, PORT_GATES } from '../lib/constants';
import { ResilientImage } from '../components/ResilientImage';

export const DekheilaPortPage: React.FC = () => {
  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-12">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-semibold text-orange-600 mb-2">نطاق التشغيل الأول · الميناء الثاني</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
              عمليات نقل الحاويات في ميناء الدخيلة
            </h1>
            <p className="text-base text-slate-600 leading-relaxed mb-6">
              يمثل ميناء الدخيلة محوراً حيوياً لحاويات الترانزيت، الخامات الصناعية، والواردات ذات الحمولات الكبيرة غرب الإسكندرية. تربط MH CARGO أصحاب البضائع بجرارات مجهزة للعمل داخل ساحات الدخيلة.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shipments/new?port=dekheila"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <span>طلب نقل من/إلى ميناء الدخيلة</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/ports/alexandria"
                className="inline-flex items-center px-5 py-3 border border-slate-300 hover:border-slate-950 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
              >
                عرض ميناء الإسكندرية
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px]">
            <ResilientImage
              src={ASSET_IMAGES.dekheilaPort}
              alt="بوابة محطة حاويات ميناء الدخيلة"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-4">
              نقاط التحميل والبوابات المعتمدة
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {PORT_GATES.dekheila.map((gate, i) => (
                <li key={gate} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="font-mono text-orange-600 ml-2">0{i + 1}.</span>
                  {gate}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-4">
              جاهزية الأسطول لمسارات الدخيلة
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                يتميز ميناء الدخيلة بارتباطه المباشر بمحاور الطرق السريعة المتجهة إلى برج العرب والطريق الصحراوي وطريق وادي النطرون، ما يجعل اختيار الجرار المناسب بالحمولة الدقيقة عاملاً حاسماً.
              </p>
              <p className="text-slate-900 font-medium">
                دعم كامل لحاويات 20 قدم الثقيلة، وحاويات 40 قدم العالية، وشاسيهات التبريد المجهزة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
