import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ASSET_IMAGES } from '../lib/constants';
import { ResilientImage } from '../components/ResilientImage';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-2">من نحن</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
            بنية رقمية متخصصة لقطاع نقل الحاويات البري في مصر
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            تأسست منصة MH CARGO لمعالجة فجوة التواصل والتسعير في سوق نقل الحاويات بين الموانئ البحرية والمناطق الصناعية والمخازن، عبر توفير نقطة التقاء موثوقة وشفافة لأصحاب الشحنات والناقلين.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-16">
          <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px]">
            <ResilientImage
              src={ASSET_IMAGES.alexandriaPort}
              alt="عمليات الحاويات في ميناء الإسكندرية"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-950 mb-2">
                  رؤيتنا التشغيلية
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  أن تصبح MH CARGO المرجع التشغيلي الأول لتنظيم حركة شاحنات الحاويات في الموانئ المصرية، بدءاً من ميناء الإسكندرية وميناء الدخيلة، مع تقليل زمن انتظار الشاحنات وضمان وضوح التكلفة لكل طرف.
                </p>
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-950 mb-2">
                  قيمنا في العمل
                </h2>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li>01. الشفافية الكاملة في عروض الأسعار ونسب العمولات قبل التعاقد.</li>
                  <li>02. التحقق من بيانات الناقلين وأساطيل الجرارات والشاسيهات.</li>
                  <li>03. حماية خصوصية بيانات العملاء وتفاصيل الشحنات والاتفاقات.</li>
                  <li>04. التدرج المدروس في التوسع الجغرافي لضمان جودة التشغيل الفعلي.</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <span>انضم إلى المنصة</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center px-5 py-2.5 border border-slate-300 hover:border-slate-950 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
              >
                تواصل مع فريق الإدارة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
