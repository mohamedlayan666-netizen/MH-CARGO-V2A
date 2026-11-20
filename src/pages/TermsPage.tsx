import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 space-y-6">
          <div>
            <p className="text-sm font-semibold text-orange-600 mb-2">الوثائق القانونية</p>
            <h1 className="font-display text-3xl font-extrabold text-slate-950">
              الشروط والأحكام لمنصة MH CARGO
            </h1>
          </div>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">1. طبيعة الخدمة ونطاق التشغيل</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تعمل منصة MH CARGO كوسيط تقني يربط أصحاب الشحنات بشركات النقل وأصحاب الشاحنات والجرارات المتخصصة في نقل الحاويات داخل جمهورية مصر العربية، ويقتصر نطاق التشغيل في مرحلتها الأولى على ميناء الإسكندرية وميناء الدخيلة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">2. التزامات صاحب الشحنة</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              يلتزم صاحب الشحنة بإدخال بيانات صحيحة ودقيقة حول حجم الحاوية ونوعها ووزن الحمولة الفعلي ومكان التسليم وتاريخ السحب، وتوفير أذون الإفراج والتصاريح اللازمة لدخول الشاحنة للميناء.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">3. التزامات الناقل</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              يلتزم الناقل بتسجيل بيانات صحيحة لشاحناته وجراراته وسائقيه، والالتزام بالمواعيد المتفق عليها في العرض المقبول، والحفاظ على سلامة الحاوية والحمولة وتحديث حالة التنفيذ عبر المنصة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">4. نظام العمولات والتسويات</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تحتسب المنصة عمولة من الطرفين وفق النسب المعلنة والمحددة في لوحة الإدارة عند قبول عرض السعر، وتُسجل العملية في قاعدة البيانات. لا يتم تنفيذ أي تحصيل مالي إلكتروني تلقائي قبل اعتماد واختبار بوابة دفع رسمية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">5. تعليق الحسابات المخالفة</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تحتفظ إدارة المنصة بالحق في مراجعة حسابات الناقلين والشاحنين وتعليق أي حساب يثبت تقديمه لبيانات غير صحيحة أو إخلاله بالتزامات التشغيل أو التحايل على نظام المنصة.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
