import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const HowItWorksPage: React.FC = () => {
  const { commissionSettings } = useAuth();

  const steps = [
    {
      num: '01',
      actor: 'صاحب الشحنة',
      title: 'إنشاء حساب وطرح طلب نقل حاوية',
      desc: 'يسجل صاحب الشحنة أو المصنع حسابه، ثم ينشئ طلباً يحدد فيه ميناء الإسكندرية أو الدخيلة، اتجاه النقل، حجم ونوع الحاوية، الوزن، تاريخ السحب، وموقع التسليم.',
    },
    {
      num: '02',
      actor: 'الناقل / صاحب الشاحنة',
      title: 'استعراض الطلبات وتقديم عرض سعر بشاحنة مسجلة',
      desc: 'ينشئ الناقل ملف شركته ويسجل شاحناته وسائقيه، ثم يتصفح الطلبات المفتوحة ويقدم عرض السعر بالجنيه المصري مع تحديد الشاحنة والمدة المتوقعة.',
    },
    {
      num: '03',
      actor: 'صاحب الشحنة',
      title: 'مقارنة العروض وقبول الأنسب بشفافية',
      desc: 'يراجع صاحب الشحنة العروض المقدمة ويرى تفصيل العمولة وإجمالي المستحق بوضوح قبل الموافقة، ثم يقبل العرض المناسب أو يرفض العروض الأخرى.',
    },
    {
      num: '04',
      actor: 'الناقل والشاحن والمنصة',
      title: 'توثيق العمولة ومتابعة التنفيذ حتى الإغلاق',
      desc: 'عند الترسية يتم تسجيل عمولة الطرفين في قاعدة البيانات (بدون تحصيل إلكتروني فعلي لحين اعتماد بوابة الدفع)، ويحدث الناقل حالة الرحلة حتى التسليم النهائي.',
    },
  ];

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-2">آلية العمل</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
            كيف تعمل منصة MH CARGO خطوة بخطوة؟
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            دورة تشغيل واضحة تفصل صلاحيات الشاحن والناقل والإدارة وتضمن توثيق كل عرض وقبول وحالة تنفيذ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {steps.map((step) => (
            <div key={step.num} className="bg-white border border-slate-200 rounded-xl p-7">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span className="font-mono font-semibold text-orange-600">{step.num}</span>
                <span aria-hidden="true">·</span>
                <span>{step.actor}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-950 mb-3">
                {step.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Commission transparency panel */}
        <div className="bg-slate-950 text-white rounded-xl p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold mb-3">
              نظام العمولات القابل للتعديل من الإدارة
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              تعتمد المنصة عمولة مزدوجة من الطرفين تُحسب كنسبة مئوية من قيمة عرض السعر المقبول: حالياً{' '}
              <span className="font-mono font-bold text-orange-400 tabular-nums">
                {commissionSettings.shipperCommissionPercent}%
              </span>{' '}
              على صاحب الشحنة و{' '}
              <span className="font-mono font-bold text-orange-400 tabular-nums">
                {commissionSettings.carrierCommissionPercent}%
              </span>{' '}
              على الناقل. تُسجل العمولات في قاعدة البيانات دون تنفيذ خصم مالي فعلي قبل ربط بوابة دفع معتمدة.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>ابدأ الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
