import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ASSET_IMAGES } from '../lib/constants';
import { ResilientImage } from '../components/ResilientImage';

export const ServicesPage: React.FC = () => {
  const services = [
    {
      num: '01',
      title: 'نقل حاويات الوارد من الموانئ للمخازن',
      desc: 'سحب الحاويات المفرج عنها جمركياً من ساحات ميناء الإسكندرية وميناء الدخيلة وتوصيلها إلى مصانع ومخازن العملاء في كافة محافظات الجمهورية.',
      specs: 'حاويات 20 قدم · 40 قدم · 40 قدم مرتفعة High Cube',
    },
    {
      num: '02',
      title: 'نقل حاويات الصادر من المصانع للموانئ',
      desc: 'توجيه جرارات مجهزة لاستلام الحاويات الفارغة أو المعبأة من مواقع الإنتاج وتسليمها في الموعد المحدد داخل الميناء قبل إغلاق الباخرة.',
      specs: 'التنسيق مع بوابات الصادر ومواعيد الشحن البحري',
    },
    {
      num: '03',
      title: 'نقل الحاويات المبردة (Reefer)',
      desc: 'توفير شاسيهات مجهزة بمولدات تبريد (Genset) للمنتجات الغذائية والدوائية والحاصلات الزراعية التي تتطلب ثبات درجة الحرارة طوال الرحلة.',
      specs: 'شاسيهات مبردة مخصصة · متابعة مستمرة لحالة الرحلة',
    },
    {
      num: '04',
      title: 'نقل الحاويات الخاصة والمكشوفة',
      desc: 'تغطية احتياجات نقل المعدات وخطوط الإنتاج عبر حاويات Open Top وFlat Rack وصهاريج ISO Tank بجرارات ذات قدرات حمولة عالية.',
      specs: 'سطحات ثقيلة ولوابد · تأمين تثبيت الحمولة',
    },
  ];

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-14">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-sm font-semibold text-orange-600 mb-2">خدماتنا اللوجستية</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
              حلول متخصصة لنقل الحاويات البرية بين الموانئ والمواقع
            </h1>
            <p className="text-base text-slate-600 leading-relaxed mb-6">
              صُممت خدمات MH CARGO لتلبي احتياجات المستوردين، المصدرين، المستخلصين الجمركيين، وشركات النقل البري وفق إجراءات واضحة تضمن سرعة الترسية وانضباط التسليم.
            </p>
            <div>
              <Link
                to="/shipments/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <span>إنشاء طلب نقل جديد</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[260px]">
            <ResilientImage
              src={ASSET_IMAGES.fleetTruck}
              alt="أسطول شاحنات نقل الحاويات"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((srv) => (
            <div
              key={srv.num}
              className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between"
            >
              <div>
                <p className="font-mono text-xs font-semibold text-orange-600 mb-2">
                  {srv.num}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-950 mb-3">
                  {srv.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {srv.desc}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
                {srv.specs}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
