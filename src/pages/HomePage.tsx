import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Anchor, CheckCircle2, Container, ShieldCheck, Truck } from 'lucide-react';
import { ASSET_IMAGES } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { fetchVerifiedCarriersCount } from '../services/firestoreService';
import { ResilientImage } from '../components/ResilientImage';

export const HomePage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, commissionSettings } = useAuth();
  const [verifiedCarriersCount, setVerifiedCarriersCount] = useState<number | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setVerifiedCarriersCount(null);
      return;
    }
    fetchVerifiedCarriersCount().then(setVerifiedCarriersCount);
  }, [firebaseUser]);

  const primaryCtaPath = !firebaseUser
    ? '/register'
    : isAdmin
      ? '/admin'
      : profile?.role === 'carrier'
        ? '/carrier'
        : '/shipments/new';

  const primaryCtaLabel = !firebaseUser
    ? 'إنشاء حساب وبدء النقل'
    : isAdmin
      ? 'الانتقال إلى لوحة الإدارة'
      : profile?.role === 'carrier'
        ? 'استعراض طلبات النقل المتاحة'
        : 'إنشاء طلب نقل حاوية';

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <ResilientImage
            src={ASSET_IMAGES.heroPort}
            alt="محطة حاويات ميناء الإسكندرية ومنظومة النقل البري"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/85 to-slate-950/50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-orange-400 mb-4">
              منصة ذكية لنقل الحاويات · الإسكندرية والدخيلة
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white mb-6">
              ربط مباشر بين أصحاب الشحنات وأساطيل نقل الحاويات في مصر
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8 max-w-xl">
              منصة رقمية متخصصة تدير طلبات سحب وإيداع الحاويات من وإلى ميناء الإسكندرية وميناء الدخيلة نحو كافة المصانع والمخازن بالمحافظات، بعروض أسعار شفافة ومتابعة تشغيلية موثقة.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <Link
                to={primaryCtaPath}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-base rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="text-sm font-semibold text-slate-200 hover:text-white underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                تعرّف على آلية العمل
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Full-width 4-Column Operational Scope Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">نطاق الموانئ المرحلة الأولى</p>
              <p className="font-display text-xl font-bold text-slate-950">الإسكندرية والدخيلة</p>
              <p className="text-xs text-slate-600">تغطية بوابات الوارد والصادر</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">أحجام الحاويات المدعومة</p>
              <p className="font-display text-xl font-bold text-slate-950 tabular-nums">20 · 40 · 40 HC</p>
              <p className="text-xs text-slate-600">جافة، مبردة، ومكشوفة السقف</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">نسبة عمولة المنصة الحالية</p>
              <p className="font-display text-xl font-bold text-slate-950 tabular-nums">
                {commissionSettings.shipperCommissionPercent}% شاحن · {commissionSettings.carrierCommissionPercent}% ناقل
              </p>
              <p className="text-xs text-slate-600">تسجيل شفاف قبل تأكيد الترسية</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">الناقلون المعتمدون بالشبكة</p>
              <p className="font-display text-xl font-bold text-slate-950 tabular-nums">
                {verifiedCarriersCount !== null ? verifiedCarriersCount : '—'} شركة نقل
              </p>
              <p className="text-xs text-slate-600">تحديث مباشر من قاعدة البيانات</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Two-Port Focus (Alexandria & El-Dekheila) */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-orange-600 mb-2">نطاق التشغيل الأول</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-950 mb-4">
              تركيز تشغيلي متخصص في ميناءي الإسكندرية والدخيلة
            </h2>
            <p className="text-slate-600 leading-relaxed">
              انطلقت MH CARGO للتركيز على أهم بوابتي تجارة بحرية في مصر، مما يضمن دقة المواعيد عند البوابات الجمركية وتوافر الجرارات المجهزة بالقرب من ساحات الحاويات.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Alexandria Port Card */}
            <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <ResilientImage
                  src={ASSET_IMAGES.alexandriaPort}
                  alt="محطة حاويات ميناء الإسكندرية"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span>البوابة الرئيسية للتجارة</span>
                    <span aria-hidden="true">·</span>
                    <span>باب 27 · باب 54 · محطة تحيا مصر</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-950 mb-3">
                    ميناء الإسكندرية
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    تنظيم سحب الحاويات الواردة وإيداع حاويات الصادر عبر محطة حاويات الإسكندرية والأرصفة متعددة الأغراض، مع ربط مباشر بالمخازن والمدن الصناعية في برج العرب والعاشر من رمضان والسادس من أكتوبر.
                  </p>
                </div>
                <Link
                  to="/ports/alexandria"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:text-orange-600 transition-colors"
                >
                  <span>تفاصيل التشغيل في ميناء الإسكندرية</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </article>

            {/* El-Dekheila Port Card */}
            <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <ResilientImage
                  src={ASSET_IMAGES.dekheilaPort}
                  alt="بوابة الحاويات في ميناء الدخيلة"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span>محور غرب الإسكندرية</span>
                    <span aria-hidden="true">·</span>
                    <span>محطة الدخيلة · رصيف 96 · ساحات الإيداع</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-950 mb-3">
                    ميناء الدخيلة
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    تغطية متكاملة لحركة الشاحنات الثقيلة والجرارات في ميناء الدخيلة ومحطاته المتخصصة، مع تنسيق مواعيد الدخول والخروج عبر الطريق الساحلي الدولي ومحاور النقل السريع.
                  </p>
                </div>
                <Link
                  to="/ports/dekheila"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 hover:text-orange-600 transition-colors"
                >
                  <span>تفاصيل التشغيل في ميناء الدخيلة</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Capabilities & Mechanism Split */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 space-y-8">
              <div>
                <p className="text-sm font-semibold text-orange-600 mb-2">لماذا MH CARGO؟</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-950 mb-4">
                  دورة نقل حاويات منضبطة من الطلب حتى التسليم النهائي
                </h2>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200">
                <div className="py-5 flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                    <Container className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-1">
                      01. طلبات نقل محددة المواصفات
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      يحدد صاحب الشحنة الميناء، البوابة، نوع وحجم الحاوية، الوزن، تاريخ السحب، وموقع التسليم أو المصنع بدقة لضمان توافق الشاحنات المتقدمة.
                    </p>
                  </div>
                </div>

                <div className="py-5 flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-1">
                      02. عروض أسعار تنافسية بشاحنات مسجلة
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      يتقدم الناقلون بعروضهم مع تحديد الجرار والشاسيه المخصص ومدة التوصيل المتوقعة، ليقارن الشاحن ويختار العرض الأنسب.
                    </p>
                  </div>
                </div>

                <div className="py-5 flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-1">
                      03. تحديث مراحل التنفيذ حتى التسليم
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      يتابع الطرفان انتقال الطلب من الترسية إلى التحرك، التواجد على بوابة الميناء، التسليم في المخزن، وحتى الإغلاق النهائي.
                    </p>
                  </div>
                </div>

                <div className="py-5 flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-1">
                      04. عمولة واضحة وتوثيق إداري
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      تُحتسب عمولة الطرفين وتُسجل إلكترونياً في سجل العمليات عند قبول العرض، مع مراجعة إدارية لحسابات الناقلين ومعالجة الشكاوى.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[320px]">
                <ResilientImage
                  src={ASSET_IMAGES.fleetTruck}
                  alt="جرار نقل حاويات على الطريق الساحلي"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-slate-950 text-white rounded-xl p-7">
                <h3 className="font-display text-xl font-bold mb-2">
                  هل تمثل شركة نقل أو تمتلك جرارات حاويات؟
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  سجل شركتك وأضف بيانات أسطولك لاستعراض طلبات نقل الحاويات المباشرة في الإسكندرية والدخيلة وتقديم عروض الأسعار.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تسجيل حساب ناقل</span>
                  </Link>
                  <Link
                    to="/services"
                    className="text-sm font-medium text-slate-200 hover:text-white underline underline-offset-4"
                  >
                    استعراض الخدمات
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
