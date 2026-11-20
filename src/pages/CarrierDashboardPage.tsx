import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquareWarning,
  PackageOpen,
  Plus,
  Receipt,
  Trash2,
  Truck as TruckIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  COMPLAINT_STATUS_LABELS,
  CONTAINER_SIZE_LABELS,
  EGYPT_GOVERNORATES,
  formatEgp,
  OFFER_STATUS_LABELS,
  PORT_LABELS,
  SETTLEMENT_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  TRAILER_TYPE_LABELS,
  TRUCK_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '../lib/constants';
import {
  createComplaint,
  createTruck,
  deleteTruck,
  saveCarrierProfile,
  subscribeCarrierAssignedShipments,
  subscribeCarrierOffers,
  subscribeCarrierTrucks,
  subscribeOpenShipments,
  subscribeOwnCarrierProfile,
  subscribeOwnComplaints,
  subscribeUserCommissions,
  updateShipmentStatus,
  updateTruckStatus,
  withdrawOffer,
} from '../services/firestoreService';
import type {
  CarrierProfile,
  CommissionLedger,
  Complaint,
  ContainerSize,
  Offer,
  PortId,
  Shipment,
  TrailerType,
  Truck,
  TruckStatus,
} from '../types/domain';

type CarrierTab = 'market' | 'assigned' | 'offers' | 'fleet' | 'company' | 'commissions' | 'complaints';

export const CarrierDashboardPage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, authReady, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<CarrierTab>('market');
  const [openShipments, setOpenShipments] = useState<Shipment[]>([]);
  const [assignedShipments, setAssignedShipments] = useState<Shipment[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [carrierProfile, setCarrierProfile] = useState<CarrierProfile | null>(null);
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Market filters
  const [portFilter, setPortFilter] = useState<'all' | PortId>('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | ContainerSize>('all');

  // New Truck Form
  const [plateNumber, setPlateNumber] = useState('');
  const [tractorModel, setTractorModel] = useState('');
  const [trailerType, setTrailerType] = useState<TrailerType>('skeleton_40');
  const [maxPayloadTons, setMaxPayloadTons] = useState(35);
  const [supportedSizes, setSupportedSizes] = useState<ContainerSize[]>(['20ft', '40ft', '40ft_hc']);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [truckMessage, setTruckMessage] = useState('');

  // Company Profile Form
  const [cpCompanyName, setCpCompanyName] = useState('');
  const [cpOwnerName, setCpOwnerName] = useState('');
  const [cpCity, setCpCity] = useState('الإسكندرية');
  const [cpPorts, setCpPorts] = useState<PortId[]>(['alexandria', 'dekheila']);
  const [cpYears, setCpYears] = useState(5);
  const [cpDescription, setCpDescription] = useState('');
  const [cpSaved, setCpSaved] = useState('');

  // Complaint Form
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDetails, setCmpDetails] = useState('');
  const [cmpSaved, setCmpSaved] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (carrierProfile) {
      setCpCompanyName(carrierProfile.companyName);
      setCpOwnerName(carrierProfile.ownerName);
      setCpCity(carrierProfile.city);
      setCpPorts(carrierProfile.servicePorts);
      setCpYears(carrierProfile.yearsExperience);
      setCpDescription(carrierProfile.description);
    } else if (profile) {
      setCpCompanyName(profile.companyName);
      setCpOwnerName(profile.displayName);
      setCpCity(profile.city || 'الإسكندرية');
    }
  }, [carrierProfile, profile]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub1 = subscribeOpenShipments(setOpenShipments);
    const unsub2 = subscribeCarrierAssignedShipments(firebaseUser.uid, setAssignedShipments);
    const unsub3 = subscribeCarrierOffers(firebaseUser.uid, setMyOffers);
    const unsub4 = subscribeCarrierTrucks(firebaseUser.uid, setTrucks);
    const unsub5 = subscribeOwnCarrierProfile(firebaseUser.uid, setCarrierProfile);
    const unsub6 = subscribeUserCommissions(firebaseUser.uid, 'carrier', setCommissions);
    const unsub7 = subscribeOwnComplaints(firebaseUser.uid, setComplaints);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [firebaseUser]);

  if (!authReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        جارٍ تحميل لوحة الناقل...
      </div>
    );
  }

  if (!firebaseUser || (!profile && !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            يرجى تسجيل الدخول للوصول إلى لوحة الناقل
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            أنشئ حساب ناقل لتسجيل أسطول الجرارات واستعراض طلبات نقل الحاويات.
          </p>
          <Link
            to="/login"
            className="inline-flex px-6 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg hover:bg-orange-600"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.role === 'shipper' && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            حسابك مسجل كصاحب شحنة
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            يرجى الانتقال إلى لوحة صاحب الشحنة لإدارة طلباتك.
          </p>
          <Link
            to="/shipper"
            className="inline-flex px-5 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg"
          >
            الانتقال إلى لوحة الشاحن
          </Link>
        </div>
      </div>
    );
  }

  const filteredMarket = openShipments.filter((s) => {
    const matchPort = portFilter === 'all' || s.port === portFilter;
    const matchSize = sizeFilter === 'all' || s.containerSize === sizeFilter;
    return matchPort && matchSize;
  });

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setTruckMessage('');
    setActionError('');
    try {
      await createTruck({
        carrierCompany: profile?.companyName || cpCompanyName || 'شركة نقل',
        plateNumber,
        tractorModel,
        trailerType,
        maxPayloadTons,
        supportedContainerSizes: supportedSizes,
        driverName,
        driverPhone,
      });
      setPlateNumber('');
      setTractorModel('');
      setDriverName('');
      setDriverPhone('');
      setTruckMessage('تمت إضافة الشاحنة للأسطول بنجاح.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر إضافة الشاحنة.');
    }
  };

  const toggleSupportedSize = (size: ContainerSize) => {
    setSupportedSizes((prev) =>
      prev.includes(size) ? (prev.length > 1 ? prev.filter((s) => s !== size) : prev) : [...prev, size]
    );
  };

  const toggleServicePort = (p: PortId) => {
    setCpPorts((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((item) => item !== p) : prev) : [...prev, p]
    );
  };

  const handleSaveCarrierProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpSaved('');
    setActionError('');
    try {
      await saveCarrierProfile(carrierProfile, {
        companyName: cpCompanyName,
        ownerName: cpOwnerName,
        city: cpCity,
        servicePorts: cpPorts,
        yearsExperience: cpYears,
        description: cpDescription,
        truckCount: trucks.length,
      });
      setCpSaved('تم حفظ ملف شركة النقل وإرساله للمراجعة الإدارية.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر حفظ ملف الشركة.');
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmpSaved('');
    setActionError('');
    try {
      await createComplaint({
        reporterName: profile?.displayName || firebaseUser.email || 'ناقل',
        reporterRole: 'carrier',
        subject: cmpSubject,
        details: cmpDetails,
      });
      setCmpSubject('');
      setCmpDetails('');
      setCmpSaved('تم تسجيل الشكوى لإدارة المنصة.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر إرسال الشكوى.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: { id: CarrierTab; label: string; icon: React.ReactNode }[] = [
    { id: 'market', label: `الطلبات المتاحة (${openShipments.length})`, icon: <PackageOpen className="w-4 h-4" /> },
    { id: 'assigned', label: `رحلاتي المقبولة (${assignedShipments.length})`, icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'offers', label: `عروض الأسعار (${myOffers.length})`, icon: <FileText className="w-4 h-4" /> },
    { id: 'fleet', label: `الشاحنات والأسطول (${trucks.length})`, icon: <TruckIcon className="w-4 h-4" /> },
    { id: 'company', label: 'ملف الشركة الناقلة', icon: <Building2 className="w-4 h-4" /> },
    { id: 'commissions', label: 'سجل العمولات', icon: <Receipt className="w-4 h-4" /> },
    { id: 'complaints', label: 'الشكاوى', icon: <MessageSquareWarning className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>لوحة الناقل</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-orange-600">
                {carrierProfile
                  ? VERIFICATION_STATUS_LABELS[carrierProfile.verificationStatus]
                  : 'يرجى استكمال ملف الشركة'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-950">
              {profile?.companyName || carrierProfile?.companyName || 'حساب شركة النقل'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab('fleet')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شاحنة</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:border-slate-950 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {profile?.accountStatus === 'suspended' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            حسابك معلق إدارياً ولا يمكنك تقديم عروض أسعار جديدة. يرجى التواصل مع الإدارة.
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {actionError}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">طلبات متاحة بالموانئ</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {openShipments.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">رحلات مسندة لي</p>
            <p className="font-display text-2xl font-bold text-orange-600 tabular-nums">
              {assignedShipments.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">الشاحنات المسجلة</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {trucks.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">صافي مستحقات مسجلة</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {formatEgp(
                commissions.reduce((sum, c) => sum + (c.agreedPriceEgp - c.carrierFeeEgp), 0)
              )}
            </p>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === item.id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </aside>

          <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl p-6">
            {/* 1. Open Market */}
            {tab === 'market' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        ['all', 'كل الموانئ'],
                        ['alexandria', 'الإسكندرية'],
                        ['dekheila', 'الدخيلة'],
                      ] as const
                    ).map(([p, lbl]) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPortFilter(p)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                          portFilter === p ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value as 'all' | ContainerSize)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="all">جميع أحجام الحاويات</option>
                    {Object.entries(CONTAINER_SIZE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredMarket.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-800">
                      لا توجد طلبات نقل مفتوحة تطابق التصنيف الحالي
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {filteredMarket.map((s) => (
                      <div
                        key={s.shipmentId}
                        className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-900">
                              {s.referenceCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{PORT_LABELS[s.port]}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">التاريخ: {s.pickupDate}</span>
                          </div>
                          <h2 className="font-display text-base font-bold text-slate-950">
                            {s.deliveryGovernorate} — {s.deliveryLocation}
                          </h2>
                          <p className="text-xs text-slate-600 tabular-nums">
                            {s.containerCount} × {CONTAINER_SIZE_LABELS[s.containerSize]} ·{' '}
                            {s.cargoWeightTons} طن · {s.cargoDescription}
                          </p>
                        </div>

                        <Link
                          to={`/shipments/${s.shipmentId}`}
                          className="inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          تقديم عرض سعر
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Assigned Trips */}
            {tab === 'assigned' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  الطلبات المقبولة وقيد التنفيذ
                </h2>
                {assignedShipments.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    لا توجد رحلات مسندة لك حالياً.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {assignedShipments.map((s) => (
                      <div key={s.shipmentId} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-900">{s.referenceCode}</span>
                            <span aria-hidden="true">·</span>
                            <span>{PORT_LABELS[s.port]}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-orange-600">
                              {SHIPMENT_STATUS_LABELS[s.status]}
                            </span>
                          </div>
                          <p className="font-display text-base font-bold text-slate-950">
                            {s.deliveryGovernorate} — {s.deliveryLocation}
                          </p>
                          <p className="text-xs text-slate-600 tabular-nums">
                            صافي المستحق: {formatEgp(s.netCarrierPayoutEgp)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {s.status === 'assigned' && (
                            <button
                              type="button"
                              onClick={() => updateShipmentStatus(s.shipmentId, 'in_transit')}
                              className="px-3 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 cursor-pointer"
                            >
                              بدء التحرك
                            </button>
                          )}
                          {s.status === 'in_transit' && (
                            <button
                              type="button"
                              onClick={() => updateShipmentStatus(s.shipmentId, 'at_gate')}
                              className="px-3 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 cursor-pointer"
                            >
                              على البوابة
                            </button>
                          )}
                          {(s.status === 'in_transit' || s.status === 'at_gate') && (
                            <button
                              type="button"
                              onClick={() => updateShipmentStatus(s.shipmentId, 'delivered')}
                              className="px-3 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-500 cursor-pointer"
                            >
                              تم التسليم
                            </button>
                          )}
                          <Link
                            to={`/shipments/${s.shipmentId}`}
                            className="px-3 py-2 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:border-slate-950"
                          >
                            التفاصيل
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. My Offers */}
            {tab === 'offers' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">عروض الأسعار المقدمة</h2>
                {myOffers.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">لم تقدم عروض أسعار بعد.</p>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {myOffers.map((o) => (
                      <div key={o.offerId} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950 tabular-nums">
                            {o.shipmentReference} · {formatEgp(o.priceEgp)}
                          </p>
                          <p className="text-xs text-slate-600">
                            {o.truckLabel} ·{' '}
                            <span className="font-semibold text-orange-600">
                              {OFFER_STATUS_LABELS[o.status]}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => withdrawOffer(o.offerId)}
                              className="px-3 py-1.5 border border-red-300 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer"
                            >
                              سحب العرض
                            </button>
                          )}
                          <Link
                            to={`/shipments/${o.shipmentId}`}
                            className="text-xs font-semibold text-slate-950 underline"
                          >
                            فتح الطلب
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Fleet / Trucks */}
            {tab === 'fleet' && (
              <div className="space-y-8">
                <form onSubmit={handleAddTruck} className="space-y-4 pb-6 border-b border-slate-200">
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    إضافة شاحنة / جرار حاويات جديد
                  </h2>
                  {truckMessage && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      {truckMessage}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      value={tractorModel}
                      onChange={(e) => setTractorModel(e.target.value)}
                      placeholder="طراز الجرار (مثال: مرسيدس أكتروس)"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="رقم اللوحة (مثال: س م أ 4821)"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                    <select
                      value={trailerType}
                      onChange={(e) => setTrailerType(e.target.value as TrailerType)}
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {Object.entries(TRAILER_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={maxPayloadTons}
                      onChange={(e) => setMaxPayloadTons(Number(e.target.value))}
                      placeholder="أقصى حمولة (طن)"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                    />
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="اسم السائق المسؤول"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="هاتف السائق"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-700">أحجام الحاويات المدعومة:</span>
                    {(['20ft', '40ft', '40ft_hc'] as ContainerSize[]).map((sz) => (
                      <label key={sz} className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={supportedSizes.includes(sz)}
                          onChange={() => toggleSupportedSize(sz)}
                        />
                        <span>{CONTAINER_SIZE_LABELS[sz]}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    حفظ الشاحنة بالأسطول
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="font-display text-base font-bold text-slate-950">
                    الشاحنات المسجلة ({trucks.length})
                  </h3>
                  {trucks.length === 0 ? (
                    <p className="text-xs text-slate-500">لم تقم بإضافة أي شاحنات بعد.</p>
                  ) : (
                    <div className="divide-y divide-slate-200 border-t border-slate-200">
                      {trucks.map((t) => (
                        <div
                          key={t.truckId}
                          className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              {t.tractorModel} — {t.plateNumber}
                            </p>
                            <p className="text-xs text-slate-600 tabular-nums">
                              {TRAILER_TYPE_LABELS[t.trailerType]} · حمولة {t.maxPayloadTons} طن ·
                              السائق: {t.driverName} ({t.driverPhone})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={t.status}
                              onChange={(e) =>
                                updateTruckStatus(t.truckId, e.target.value as TruckStatus)
                              }
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            >
                              {Object.entries(TRUCK_STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => deleteTruck(t.truckId)}
                              aria-label="حذف الشاحنة"
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Company Profile */}
            {tab === 'company' && (
              <form onSubmit={handleSaveCarrierProfile} className="space-y-5 max-w-xl">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    ملف شركة النقل والاعتماد الإداري
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    الحالة الحالية:{' '}
                    <strong className="text-orange-600">
                      {carrierProfile
                        ? VERIFICATION_STATUS_LABELS[carrierProfile.verificationStatus]
                        : 'غير مسجل بعد'}
                    </strong>
                  </p>
                </div>
                {cpSaved && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {cpSaved}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      اسم شركة النقل
                    </label>
                    <input
                      type="text"
                      required
                      value={cpCompanyName}
                      onChange={(e) => setCpCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      اسم المالك / مدير التشغيل
                    </label>
                    <input
                      type="text"
                      required
                      value={cpOwnerName}
                      onChange={(e) => setCpOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      المقر الرئيسي
                    </label>
                    <select
                      value={cpCity}
                      onChange={(e) => setCpCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {EGYPT_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      سنوات الخبرة في نقل الحاويات
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cpYears}
                      onChange={(e) => setCpYears(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-700">
                    الموانئ التي يغطيها الأسطول
                  </span>
                  <div className="flex gap-4 text-xs">
                    {(['alexandria', 'dekheila'] as PortId[]).map((p) => (
                      <label key={p} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cpPorts.includes(p)}
                          onChange={() => toggleServicePort(p)}
                        />
                        <span>{PORT_LABELS[p]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    نبذة عن الأسطول والخبرة التشغيلية
                  </label>
                  <textarea
                    rows={3}
                    value={cpDescription}
                    onChange={(e) => setCpDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  حفظ ملف الشركة
                </button>
              </form>
            )}

            {/* 6. Commissions */}
            {tab === 'commissions' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">سجل عمولات الناقل</h2>
                {commissions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">لا توجد عمليات مسجلة بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-3 font-semibold">الطلب</th>
                          <th className="py-3 font-semibold">الشاحن</th>
                          <th className="py-3 font-semibold">قيمة العرض</th>
                          <th className="py-3 font-semibold">عمولة الناقل</th>
                          <th className="py-3 font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {commissions.map((c) => (
                          <tr key={c.commissionId}>
                            <td className="py-3 font-mono">{c.shipmentReference}</td>
                            <td className="py-3">{c.shipperCompany}</td>
                            <td className="py-3">{formatEgp(c.agreedPriceEgp)}</td>
                            <td className="py-3 font-semibold">
                              {formatEgp(c.carrierFeeEgp)} ({c.carrierRatePercent}%)
                            </td>
                            <td className="py-3 text-slate-600">
                              {SETTLEMENT_STATUS_LABELS[c.settlementStatus]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 7. Complaints */}
            {tab === 'complaints' && (
              <div className="space-y-6">
                <form onSubmit={handleCreateComplaint} className="space-y-4 pb-6 border-b border-slate-200">
                  <h2 className="font-display text-lg font-bold text-slate-950">تقديم شكوى للإدارة</h2>
                  {cmpSaved && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      {cmpSaved}
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    value={cmpSubject}
                    onChange={(e) => setCmpSubject(e.target.value)}
                    placeholder="عنوان الشكوى"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={3}
                    required
                    value={cmpDetails}
                    onChange={(e) => setCmpDetails(e.target.value)}
                    placeholder="تفاصيل الشكوى..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 cursor-pointer"
                  >
                    إرسال الشكوى
                  </button>
                </form>

                <div className="space-y-2">
                  {complaints.map((cmp) => (
                    <div key={cmp.complaintId} className="p-4 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-900">{cmp.subject}</span>
                        <span className="text-orange-600 font-semibold">
                          {COMPLAINT_STATUS_LABELS[cmp.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{cmp.details}</p>
                      {cmp.adminNote && (
                        <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded">
                          رد الإدارة: {cmp.adminNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
