import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 space-y-6">
          <div>
            <p className="text-sm font-semibold text-orange-600 mb-2">حماية البيانات</p>
            <h1 className="font-display text-3xl font-extrabold text-slate-950">
              سياسة الخصوصية لمنصة MH CARGO
            </h1>
          </div>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">1. البيانات التي نجمعها</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تجمع المنصة البيانات اللازمة لتشغيل الحسابات وطلبات النقل، وتشمل الاسم، البريد الإلكتروني، رقم الهاتف، اسم الشركة، السجل التجاري الاختياري، وبيانات الشاحنات والسائقين وطلبات الحاويات وعروض الأسعار.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">2. عزل البيانات وصلاحيات الوصول</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تخضع كافة السجلات لقواعد أمان صارمة في قاعدة البيانات تفصل بين صلاحيات أصحاب الشحنات والناقلين ومدير المنصة. لا يطلع على أرقام الهواتف والبريد الشخصي إلا صاحب الحساب أو إدارة المنصة، ولا تظهر بيانات السائقين لغير الناقل المالك والإدارة.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">3. استخدام البيانات</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تُستخدم البيانات حصراً لتسهيل ربط طلبات النقل بعروض الأسعار المناسبة، احتساب العمولات المسجلة، معالجة الشكاوى، ومراجعة اعتماد الناقلين. لا تبيع المنصة بيانات المستخدمين لأي جهة خارجية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-950">4. تحديث وحماية الحساب</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تتم المصادقة عبر مزود الهوية الآمن، ويمكن للمستخدم تحديث بيانات شركته من لوحة التحكم الخاصة به أو التواصل مع فريق الإدارة عبر صفحة اتصل بنا لطلب مراجعة بياناته.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
