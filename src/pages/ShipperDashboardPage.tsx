import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  LogOut,
  MessageSquareWarning,
  Package,
  Plus,
  Receipt,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  ACCOUNT_STATUS_LABELS,
  CONTAINER_SIZE_LABELS,
  EGYPT_GOVERNORATES,
  formatEgp,
  OFFER_STATUS_LABELS,
  PORT_LABELS,
  SETTLEMENT_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  COMPLAINT_STATUS_LABELS,
} from '../lib/constants';
import {
  createComplaint,
  subscribeOwnComplaints,
  subscribeShipperOffers,
  subscribeShipperShipments,
  subscribeUserCommissions,
} from '../services/firestoreService';
import type { CommissionLedger, Complaint, Offer, Shipment } from '../types/domain';

type ShipperTab = 'shipments' | 'offers' | 'commissions' | 'complaints' | 'profile';

export const ShipperDashboardPage: React.FC = () => {
  const { firebaseUser, profile, isAdmin, authReady, updateOwnProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<ShipperTab>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Complaint form
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintShipmentId, setComplaintShipmentId] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [complaintFeedback, setComplaintFeedback] = useState('');

  // Profile edit form
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('الإسكندرية');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [profileSaved, setProfileSaved] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setCompanyName(profile.companyName);
      setPhone(profile.phone);
      setCity(profile.city || 'الإسكندرية');
      setCommercialRegister(profile.commercialRegister || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub1 = subscribeShipperShipments(firebaseUser.uid, setShipments);
    const unsub2 = subscribeShipperOffers(firebaseUser.uid, setOffers);
    const unsub3 = subscribeUserCommissions(firebaseUser.uid, 'shipper', setCommissions);
    const unsub4 = subscribeOwnComplaints(firebaseUser.uid, setComplaints);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [firebaseUser]);

  if (!authReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        جارٍ تحميل لوحة صاحب الشحنة...
      </div>
    );
  }

  if (!firebaseUser || (!profile && !isAdmin)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            يرجى تسجيل الدخول للوصول إلى لوحة صاحب الشحنة
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            أنشئ حساب صاحب شحنة أو سجل الدخول لإدارة طلبات نقل الحاويات.
          </p>
          <Link
            to="/login"
            className="inline-flex px-6 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.role === 'carrier' && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            حسابك مسجل كناقل
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            يرجى الانتقال إلى لوحة الناقل لإدارة أسطولك وعروض الأسعار.
          </p>
          <Link
            to="/carrier"
            className="inline-flex px-5 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg"
          >
            الانتقال إلى لوحة الناقل
          </Link>
        </div>
      </div>
    );
  }

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'open'
          ? s.status === 'open'
          : statusFilter === 'active'
            ? ['assigned', 'in_transit', 'at_gate', 'delivered'].includes(s.status)
            : statusFilter === 'completed'
              ? s.status === 'completed'
              : s.status === 'cancelled';
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.referenceCode.toLowerCase().includes(q) ||
      s.deliveryLocation.toLowerCase().includes(q) ||
      s.deliveryGovernorate.toLowerCase().includes(q) ||
      s.cargoDescription.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingOffersCount = offers.filter((o) => o.status === 'pending').length;
  const activeShipmentsCount = shipments.filter((s) =>
    ['assigned', 'in_transit', 'at_gate', 'delivered'].includes(s.status)
  ).length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved('');
    setActionError('');
    try {
      await updateOwnProfile({ displayName, companyName, phone, city, commercialRegister });
      setProfileSaved('تم حفظ تحديثات بيانات الشركة بنجاح.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر حفظ التحديثات.');
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintFeedback('');
    setActionError('');
    try {
      await createComplaint({
        reporterName: profile?.displayName || firebaseUser.email || 'صاحب شحنة',
        reporterRole: 'shipper',
        shipmentId: complaintShipmentId,
        subject: complaintSubject,
        details: complaintDetails,
      });
      setComplaintSubject('');
      setComplaintDetails('');
      setComplaintShipmentId('');
      setComplaintFeedback('تم تسجيل الشكوى وإحالتها لإدارة المنصة.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر إرسال الشكوى.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: { id: ShipperTab; label: string; icon: React.ReactNode }[] = [
    { id: 'shipments', label: 'طلبات النقل', icon: <Package className="w-4 h-4" /> },
    { id: 'offers', label: `عروض الأسعار (${pendingOffersCount})`, icon: <FileText className="w-4 h-4" /> },
    { id: 'commissions', label: 'سجل العمولات', icon: <Receipt className="w-4 h-4" /> },
    { id: 'complaints', label: 'الشكاوى', icon: <MessageSquareWarning className="w-4 h-4" /> },
    { id: 'profile', label: 'بيانات الشركة', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Workspace Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>لوحة صاحب الشحنة</span>
              <span aria-hidden="true">·</span>
              <span>{profile ? ACCOUNT_STATUS_LABELS[profile.accountStatus] : 'إداري'}</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-950">
              {profile?.companyName || 'حساب صاحب الشحنة'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/shipments/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>طلب نقل جديد</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:border-slate-950 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Suspended Alert */}
        {profile?.accountStatus === 'suspended' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            حسابك معلق إدارياً حالياً ولا يمكنك نشر طلبات نقل جديدة. تواصل مع إدارة المنصة للمراجعة.
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {actionError}
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">إجمالي الطلبات</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {shipments.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">عروض بانتظار القرار</p>
            <p className="font-display text-2xl font-bold text-orange-600 tabular-nums">
              {pendingOffersCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">شحنات قيد التنفيذ</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {activeShipmentsCount}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">عمولات مسجلة (شاحن)</p>
            <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {formatEgp(commissions.reduce((sum, c) => sum + c.shipperFeeEgp, 0))}
            </p>
          </div>
        </div>

        {/* Workspace Navigation + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === item.id
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </aside>

          {/* Main Tab Panel */}
          <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl p-6">
            {tab === 'shipments' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        ['all', 'الكل'],
                        ['open', 'مفتوح'],
                        ['active', 'قيد التنفيذ'],
                        ['completed', 'مكتمل'],
                        ['cancelled', 'ملغي'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          statusFilter === key
                            ? 'bg-white text-slate-950 shadow-sm'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب أو الوجهة..."
                      className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                {filteredShipments.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      لا توجد طلبات نقل مطابقة حالياً
                    </p>
                    <p className="text-xs text-slate-500 mb-5">
                      أنشئ طلب نقل حاوية جديد من ميناء الإسكندرية أو ميناء الدخيلة لتلقي عروض الأسعار.
                    </p>
                    <Link
                      to="/shipments/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-500"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إنشاء أول طلب نقل</span>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {filteredShipments.map((s) => {
                      const offerCountForShipment = offers.filter(
                        (o) => o.shipmentId === s.shipmentId && o.status === 'pending'
                      ).length;

                      return (
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
                              <span className="tabular-nums">{s.pickupDate}</span>
                            </div>
                            <h2 className="font-display text-base font-bold text-slate-950">
                              {s.deliveryGovernorate} — {s.deliveryLocation}
                            </h2>
                            <p className="text-xs text-slate-600 tabular-nums">
                              {s.containerCount} × {CONTAINER_SIZE_LABELS[s.containerSize]} ·{' '}
                              {s.cargoWeightTons} طن ·{' '}
                              <span className="font-semibold text-orange-600">
                                {SHIPMENT_STATUS_LABELS[s.status]}
                              </span>
                              {s.status === 'open' && (
                                <> · عروض معلقة: {offerCountForShipment}</>
                              )}
                            </p>
                          </div>

                          <Link
                            to={`/shipments/${s.shipmentId}`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-slate-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            التفاصيل والعروض
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'offers' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  جميع عروض الأسعار المستلمة
                </h2>
                {offers.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    لا توجد عروض أسعار مستلمة حتى الآن.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-3 font-semibold">رقم الطلب</th>
                          <th className="py-3 font-semibold">الشركة الناقلة</th>
                          <th className="py-3 font-semibold">الشاحنة</th>
                          <th className="py-3 font-semibold">السعر</th>
                          <th className="py-3 font-semibold">الحالة</th>
                          <th className="py-3 font-semibold">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {offers.map((o) => (
                          <tr key={o.offerId} className="hover:bg-slate-50">
                            <td className="py-3 font-mono text-slate-900">{o.shipmentReference}</td>
                            <td className="py-3 font-medium text-slate-900">{o.carrierCompany}</td>
                            <td className="py-3 text-slate-600">{o.truckLabel}</td>
                            <td className="py-3 font-semibold text-slate-950 tabular-nums">
                              {formatEgp(o.priceEgp)}
                            </td>
                            <td className="py-3 text-orange-600 font-semibold">
                              {OFFER_STATUS_LABELS[o.status]}
                            </td>
                            <td className="py-3">
                              <Link
                                to={`/shipments/${o.shipmentId}`}
                                className="text-slate-950 font-semibold hover:text-orange-600 underline"
                              >
                                مراجعة العرض
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'commissions' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    سجل العمولات المسجلة
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    تُسجل هذه العمليات إلكترونياً عند قبول العروض ولا يتم خصم مبالغ عبر بوابة دفع قبل اعتمادها.
                  </p>
                </div>
                {commissions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    لا توجد عمولات مسجلة بعد.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-3 font-semibold">الطلب</th>
                          <th className="py-3 font-semibold">الناقل</th>
                          <th className="py-3 font-semibold">قيمة النقل</th>
                          <th className="py-3 font-semibold">عمولة الشاحن</th>
                          <th className="py-3 font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {commissions.map((c) => (
                          <tr key={c.commissionId}>
                            <td className="py-3 font-mono text-slate-900">{c.shipmentReference}</td>
                            <td className="py-3 text-slate-800">{c.carrierCompany}</td>
                            <td className="py-3 text-slate-900">{formatEgp(c.agreedPriceEgp)}</td>
                            <td className="py-3 font-semibold text-slate-950">
                              {formatEgp(c.shipperFeeEgp)} ({c.shipperRatePercent}%)
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

            {tab === 'complaints' && (
              <div className="space-y-6">
                <form onSubmit={handleCreateComplaint} className="space-y-4 pb-6 border-b border-slate-200">
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    تقديم شكوى لإدارة المنصة
                  </h2>
                  {complaintFeedback && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      {complaintFeedback}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={complaintSubject}
                      onChange={(e) => setComplaintSubject(e.target.value)}
                      placeholder="موضوع الشكوى"
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                    />
                    <select
                      value={complaintShipmentId}
                      onChange={(e) => setComplaintShipmentId(e.target.value)}
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                    >
                      <option value="">شكوى عامة (غير مرتبطة بطلب)</option>
                      {shipments.map((s) => (
                        <option key={s.shipmentId} value={s.shipmentId}>
                          {s.referenceCode} — {PORT_LABELS[s.port]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="اكتب تفاصيل الشكوى..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    إرسال الشكوى
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="font-display text-base font-bold text-slate-950">
                    سجل الشكاوى المقدمة
                  </h3>
                  {complaints.length === 0 ? (
                    <p className="text-xs text-slate-500">لا توجد شكاوى مسجلة.</p>
                  ) : (
                    <div className="divide-y divide-slate-200 border-t border-slate-200">
                      {complaints.map((cmp) => (
                        <div key={cmp.complaintId} className="py-3.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{cmp.subject}</span>
                            <span className="font-semibold text-orange-600">
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
                  )}
                </div>
              </div>
            )}

            {tab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  تحديث بيانات الحساب والشركة
                </h2>
                {profileSaved && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {profileSaved}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    اسم الشركة
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      المحافظة
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {EGYPT_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={commercialRegister}
                    onChange={(e) => setCommercialRegister(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  حفظ التغييرات
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
