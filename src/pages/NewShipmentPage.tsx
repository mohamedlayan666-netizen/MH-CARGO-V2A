import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  CONTAINER_SIZE_LABELS,
  CONTAINER_TYPE_LABELS,
  DIRECTION_LABELS,
  EGYPT_GOVERNORATES,
  PORT_GATES,
  PORT_LABELS,
} from '../lib/constants';
import { createShipment } from '../services/firestoreService';
import type {
  ContainerSize,
  ContainerType,
  PortId,
  TransportDirection,
} from '../types/domain';

export const NewShipmentPage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, authReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialPort =
    searchParams.get('port') === 'dekheila' ? 'dekheila' : 'alexandria';

  const [port, setPort] = useState<PortId>(initialPort);
  const [direction, setDirection] = useState<TransportDirection>('from_port');
  const [terminalGate, setTerminalGate] = useState(PORT_GATES[initialPort][0]);
  const [deliveryGovernorate, setDeliveryGovernorate] = useState('الإسكندرية');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [containerSize, setContainerSize] = useState<ContainerSize>('40ft');
  const [containerType, setContainerType] = useState<ContainerType>('dry');
  const [containerCount, setContainerCount] = useState(1);
  const [cargoWeightTons, setCargoWeightTons] = useState(22);
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [targetBudgetEgp, setTargetBudgetEgp] = useState(0);
  const [cargoDescription, setCargoDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        جارٍ التحقق من الجلسة...
      </div>
    );
  }

  if (!firebaseUser || (!profile && !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Lock className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-slate-950 mb-2">
            يلزم تسجيل الدخول كصاحب شحنة
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            لإنشاء طلب نقل حاوية واستقبال عروض الأسعار من الناقلين المعتمدين، يرجى تسجيل الدخول أو إنشاء حساب صاحب شحنة أولاً.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-500 transition-colors"
            >
              إنشاء حساب صاحب شحنة
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:border-slate-950 transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.accountStatus === 'suspended') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-red-700 mb-2">
            الحساب معلق إدارياً
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            لا يمكن إنشاء طلبات نقل جديدة أثناء تعليق الحساب. يرجى التواصل مع إدارة المنصة للمراجعة.
          </p>
          <Link to="/contact" className="text-sm font-semibold text-orange-600 hover:underline">
            التواصل مع الإدارة
          </Link>
        </div>
      </div>
    );
  }

  if (profile && profile.role === 'carrier' && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            هذه الصفحة مخصصة لأصحاب الشحنات
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            حسابك الحالي مسجل كناقل. يمكنك استعراض طلبات النقل المفتوحة وتقديم عروض الأسعار من لوحة الناقل.
          </p>
          <Link
            to="/carrier"
            className="inline-flex px-5 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            الذهاب إلى لوحة الناقل
          </Link>
        </div>
      </div>
    );
  }

  const handlePortChange = (newPort: PortId) => {
    setPort(newPort);
    setTerminalGate(PORT_GATES[newPort][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deliveryLocation.trim().length < 2 || cargoDescription.trim().length < 2) {
      setError('يرجى إدخال عنوان التسليم التفصيلي ووصف الحمولة.');
      return;
    }

    setSubmitting(true);
    try {
      const shipmentId = await createShipment({
        shipperCompany: profile?.companyName || 'إدارة المنصة',
        port,
        direction,
        terminalGate,
        deliveryLocation,
        deliveryGovernorate,
        containerSize,
        containerType,
        containerCount,
        cargoWeightTons,
        cargoDescription,
        instructions,
        pickupDate,
        targetBudgetEgp,
      });
      navigate(`/shipments/${shipmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنشاء طلب النقل. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to={isAdmin ? '/admin' : '/shipper'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى لوحة التحكم</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-9">
          <div className="mb-8 pb-6 border-b border-slate-200">
            <p className="text-sm font-semibold text-orange-600 mb-1">طلب نقل جديد</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mb-2">
              إنشاء طلب نقل حاوية
            </h1>
            <p className="text-sm text-slate-600">
              حدد بيانات الميناء وموقع التسليم ومواصفات الحاوية لتلقي عروض أسعار من الناقلين المعتمدين.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Port & Direction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الميناء (التحميل / الإيداع)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['alexandria', 'dekheila'] as PortId[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePortChange(p)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                        port === p
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {PORT_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اتجاه الرحلة
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TransportDirection)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {Object.entries(DIRECTION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gate & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  المحطة أو البوابة داخل الميناء
                </label>
                <select
                  value={terminalGate}
                  onChange={(e) => setTerminalGate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {PORT_GATES[port].map((gate) => (
                    <option key={gate} value={gate}>
                      {gate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  محافظة التسليم / التحميل
                </label>
                <select
                  value={deliveryGovernorate}
                  onChange={(e) => setDeliveryGovernorate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                عنوان المخزن أو المصنع التفصيلي
              </label>
              <input
                type="text"
                required
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="مثال: المنطقة الصناعية الثالثة - برج العرب الجديدة - قطعة 14"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
              />
            </div>

            {/* Container Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  حجم الحاوية
                </label>
                <select
                  value={containerSize}
                  onChange={(e) => setContainerSize(e.target.value as ContainerSize)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {Object.entries(CONTAINER_SIZE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  نوع الحاوية
                </label>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value as ContainerType)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                >
                  {Object.entries(CONTAINER_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  عدد الحاويات
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={containerCount}
                  onChange={(e) => setContainerCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الوزن الإجمالي (طن)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  step="0.5"
                  required
                  value={cargoWeightTons}
                  onChange={(e) => setCargoWeightTons(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                />
              </div>
            </div>

            {/* Schedule & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  تاريخ التحميل / السحب المطلوب
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  السعر الاسترشادي (ج.م - اختياري)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={targetBudgetEgp}
                  onChange={(e) => setTargetBudgetEgp(Number(e.target.value))}
                  placeholder="اتركه 0 لاستقبال العروض المفتوحة"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                وصف الحمولة والبضاعة
              </label>
              <input
                type="text"
                required
                value={cargoDescription}
                onChange={(e) => setCargoDescription(e.target.value)}
                placeholder="مثال: خامات بلاستيك / أجهزة كهربائية / مستلزمات إنتاج"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                تعليمات التشغيل والتفريغ (اختياري)
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="أضف تفاصيل أوقات دخول المخزن، أوناش التفريغ، أو اشتراطات البوابة الجمركية..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4">
              <Link
                to="/shipper"
                className="px-5 py-3 text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                إلغاء
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'جارٍ نشر الطلب...' : 'نشر طلب النقل'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
