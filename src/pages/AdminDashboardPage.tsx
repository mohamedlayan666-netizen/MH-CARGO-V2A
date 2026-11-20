import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  LogOut,
  MessageSquareWarning,
  Package,
  Percent,
  ShieldAlert,
  Truck,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  ACCOUNT_STATUS_LABELS,
  COMPLAINT_STATUS_LABELS,
  formatEgp,
  OFFER_STATUS_LABELS,
  PORT_LABELS,
  SETTLEMENT_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '../lib/constants';
import {
  adminMarkContactReviewed,
  adminSaveCommissionSettings,
  adminUpdateCarrierVerification,
  adminUpdateCommissionSettlement,
  adminUpdateComplaint,
  adminUpdateUserAccountStatus,
  subscribeAllCarrierProfilesAdmin,
  subscribeAllCommissionsAdmin,
  subscribeAllComplaintsAdmin,
  subscribeAllContactMessagesAdmin,
  subscribeAllOffersAdmin,
  subscribeAllShipmentsAdmin,
  subscribeAllUsersAdmin,
  updateShipmentStatus,
} from '../services/firestoreService';
import type {
  CarrierProfile,
  CommissionLedger,
  Complaint,
  ComplaintStatus,
  ContactMessage,
  Offer,
  SettlementStatus,
  Shipment,
  ShipmentStatus,
  UserProfile,
} from '../types/domain';

type AdminTab = 'overview' | 'users' | 'carriers' | 'shipments' | 'commissions' | 'complaints';

export const AdminDashboardPage: React.FC = () => {
  const { firebaseUser, isAdmin, authReady, commissionSettings, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [carriers, setCarriers] = useState<CarrierProfile[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // Commission form
  const [shipperPct, setShipperPct] = useState(commissionSettings.shipperCommissionPercent);
  const [carrierPct, setCarrierPct] = useState(commissionSettings.carrierCommissionPercent);
  const [minOrderEgp, setMinOrderEgp] = useState(commissionSettings.minOrderValueEgp);
  const [settingsSaved, setSettingsSaved] = useState('');
  const [actionError, setActionError] = useState('');

  // Admin note drafts for complaints
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setShipperPct(commissionSettings.shipperCommissionPercent);
    setCarrierPct(commissionSettings.carrierCommissionPercent);
    setMinOrderEgp(commissionSettings.minOrderValueEgp);
  }, [commissionSettings]);

  useEffect(() => {
    if (!firebaseUser || !isAdmin) return;
    const unsubs = [
      subscribeAllUsersAdmin(setUsers),
      subscribeAllCarrierProfilesAdmin(setCarriers),
      subscribeAllShipmentsAdmin(setShipments),
      subscribeAllOffersAdmin(setOffers),
      subscribeAllCommissionsAdmin(setCommissions),
      subscribeAllComplaintsAdmin(setComplaints),
      subscribeAllContactMessagesAdmin(setContactMessages),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseUser, isAdmin]);

  if (!authReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        جارٍ التحقق من صلاحيات الإدارة...
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            منطقة مخصصة لمدير المنصة فقط
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            هذا الحساب لا يملك صلاحية الوصول إلى لوحة الإدارة.
          </p>
          <Link
            to="/"
            className="inline-flex px-5 py-2.5 bg-slate-950 text-white text-sm font-semibold rounded-lg"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const totalPlatformFeesEgp = commissions
    .filter((c) => c.settlementStatus !== 'cancelled')
    .reduce((sum, c) => sum + c.totalPlatformFeeEgp, 0);
  const openComplaintsCount = complaints.filter((c) => c.status === 'open').length;
  const pendingCarriersCount = carriers.filter((c) => c.verificationStatus === 'pending').length;

  const handleSaveCommissionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved('');
    setActionError('');
    try {
      await adminSaveCommissionSettings({
        shipperCommissionPercent: shipperPct,
        carrierCommissionPercent: carrierPct,
        minOrderValueEgp: minOrderEgp,
      });
      setSettingsSaved('تم تحديث نسب العمولات في قاعدة البيانات بنجاح.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر حفظ إعدادات العمولات.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'الإحصائيات العامة', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: `المستخدمون (${users.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'carriers', label: `مراجعة الناقلين (${pendingCarriersCount})`, icon: <Truck className="w-4 h-4" /> },
    { id: 'shipments', label: `الطلبات والعروض (${shipments.length})`, icon: <Package className="w-4 h-4" /> },
    { id: 'commissions', label: 'العمولات والإعدادات', icon: <Percent className="w-4 h-4" /> },
    { id: 'complaints', label: `الشكاوى والرسائل (${openComplaintsCount})`, icon: <MessageSquareWarning className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-slate-950 text-white rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-orange-400 mb-1">
              الإدارة العليا للمنصة · Admin
            </p>
            <h1 className="font-display text-2xl font-extrabold">
              لوحة تحكم إدارة MH CARGO
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-700 hover:border-white text-sm font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
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

          {/* Content */}
          <div className="lg:col-span-9 space-y-6">
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">إجمالي الحسابات</p>
                    <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
                      {users.length}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">ملفات ناقلين بانتظار المراجعة</p>
                    <p className="font-display text-2xl font-bold text-orange-600 tabular-nums">
                      {pendingCarriersCount}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">طلبات النقل بالمنصة</p>
                    <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
                      {shipments.length}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">عروض الأسعار المقدمة</p>
                    <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
                      {offers.length}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">إجمالي العمولات المسجلة</p>
                    <p className="font-display text-2xl font-bold text-slate-950 tabular-nums">
                      {formatEgp(totalPlatformFeesEgp)}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-500 mb-1">شكاوى مفتوحة</p>
                    <p className="font-display text-2xl font-bold text-red-600 tabular-nums">
                      {openComplaintsCount}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-display text-lg font-bold text-slate-950 mb-3">
                    توزيع الطلبات حسب الموانئ
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 border border-slate-200 rounded-lg flex justify-between">
                      <span>ميناء الإسكندرية</span>
                      <strong className="tabular-nums">
                        {shipments.filter((s) => s.port === 'alexandria').length} طلب
                      </strong>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg flex justify-between">
                      <span>ميناء الدخيلة</span>
                      <strong className="tabular-nums">
                        {shipments.filter((s) => s.port === 'dekheila').length} طلب
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management */}
            {tab === 'users' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="font-display text-lg font-bold text-slate-950 mb-4">
                  إدارة المستخدمين والحسابات
                </h2>
                {users.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">لا يوجد مستخدمون مسجلون بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-3 font-semibold">الشركة والمسؤول</th>
                          <th className="py-3 font-semibold">النوع</th>
                          <th className="py-3 font-semibold">الهاتف والبريد</th>
                          <th className="py-3 font-semibold">الحالة</th>
                          <th className="py-3 font-semibold">إجراء إداري</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <tr key={u.uid}>
                            <td className="py-3">
                              <p className="font-bold text-slate-950">{u.companyName}</p>
                              <p className="text-slate-500">{u.displayName}</p>
                            </td>
                            <td className="py-3 font-semibold">
                              {u.role === 'shipper' ? 'صاحب شحنة' : 'ناقل'}
                            </td>
                            <td className="py-3 text-slate-600">
                              <p>{u.phone}</p>
                              <p className="font-mono">{u.email}</p>
                            </td>
                            <td className="py-3 font-semibold">
                              <span
                                className={
                                  u.accountStatus === 'suspended' ? 'text-red-600' : 'text-emerald-700'
                                }
                              >
                                {ACCOUNT_STATUS_LABELS[u.accountStatus]}
                              </span>
                            </td>
                            <td className="py-3">
                              {u.accountStatus === 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() => adminUpdateUserAccountStatus(u.uid, 'active')}
                                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-600 cursor-pointer"
                                >
                                  تفعيل الحساب
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => adminUpdateUserAccountStatus(u.uid, 'suspended')}
                                  className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 cursor-pointer"
                                >
                                  تعليق الحساب
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Carrier Profiles Review */}
            {tab === 'carriers' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  مراجعة واعتماد حسابات الناقلين
                </h2>
                {carriers.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">لا توجد ملفات ناقلين مقدمة للمراجعة.</p>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {carriers.map((cp) => (
                      <div key={cp.carrierId} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-bold text-slate-950 text-sm">{cp.companyName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{cp.city}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-orange-600">
                              {VERIFICATION_STATUS_LABELS[cp.verificationStatus]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            المسؤول: {cp.ownerName} · خبرة {cp.yearsExperience} سنوات · شاحنات مسجلة: {cp.truckCount} · الموانئ: {cp.servicePorts.map((p) => PORT_LABELS[p]).join('، ')}
                          </p>
                          {cp.description && <p className="text-xs text-slate-500">{cp.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => adminUpdateCarrierVerification(cp.carrierId, 'approved')}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            اعتماد الناقل
                          </button>
                          <button
                            type="button"
                            onClick={() => adminUpdateCarrierVerification(cp.carrierId, 'rejected')}
                            className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Shipments & Offers */}
            {tab === 'shipments' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-display text-lg font-bold text-slate-950 mb-4">
                    جميع طلبات النقل ({shipments.length})
                  </h2>
                  {shipments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">لا توجد طلبات نقل.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-3 font-semibold">المرجع</th>
                            <th className="py-3 font-semibold">الشاحن</th>
                            <th className="py-3 font-semibold">الميناء والوجهة</th>
                            <th className="py-3 font-semibold">الناقل المعين</th>
                            <th className="py-3 font-semibold">الحالة</th>
                            <th className="py-3 font-semibold">تفاصيل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {shipments.map((s) => (
                            <tr key={s.shipmentId}>
                              <td className="py-3 font-mono font-semibold">{s.referenceCode}</td>
                              <td className="py-3">{s.shipperCompany}</td>
                              <td className="py-3">
                                {PORT_LABELS[s.port]} ← {s.deliveryGovernorate}
                              </td>
                              <td className="py-3">{s.acceptedCarrierCompany || '—'}</td>
                              <td className="py-3">
                                <select
                                  value={s.status}
                                  onChange={(e) =>
                                    updateShipmentStatus(s.shipmentId, e.target.value as ShipmentStatus)
                                  }
                                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                                >
                                  {Object.entries(SHIPMENT_STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                      {v}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3">
                                <Link
                                  to={`/shipments/${s.shipmentId}`}
                                  className="text-orange-600 font-semibold underline"
                                >
                                  عرض
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-display text-lg font-bold text-slate-950 mb-4">
                    متابعة عروض الأسعار ({offers.length})
                  </h2>
                  {offers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">لا توجد عروض مسجلة.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-3 font-semibold">الطلب</th>
                            <th className="py-3 font-semibold">الناقل</th>
                            <th className="py-3 font-semibold">القيمة</th>
                            <th className="py-3 font-semibold">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 tabular-nums">
                          {offers.map((o) => (
                            <tr key={o.offerId}>
                              <td className="py-3 font-mono">{o.shipmentReference}</td>
                              <td className="py-3">{o.carrierCompany}</td>
                              <td className="py-3 font-semibold">{formatEgp(o.priceEgp)}</td>
                              <td className="py-3 text-orange-600 font-semibold">
                                {OFFER_STATUS_LABELS[o.status]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commissions Settings & Ledger */}
            {tab === 'commissions' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleSaveCommissionSettings}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                >
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-950">
                      إعدادات نسب العمولات
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      وضع التحصيل الحالي: تسجيل إلكتروني في قاعدة البيانات بدون خصم عبر بوابة دفع حتى اعتماد البوابة.
                    </p>
                  </div>

                  {settingsSaved && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{settingsSaved}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        عمولة صاحب الشحنة (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step="0.5"
                        value={shipperPct}
                        onChange={(e) => setShipperPct(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        عمولة الناقل (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step="0.5"
                        value={carrierPct}
                        onChange={(e) => setCarrierPct(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        الحد الأدنى لقيمة العرض (ج.م)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={minOrderEgp}
                        onChange={(e) => setMinOrderEgp(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    حفظ نسب العمولات
                  </button>
                </form>

                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-display text-lg font-bold text-slate-950 mb-4">
                    سجل العمولات والعمليات ({commissions.length})
                  </h2>
                  {commissions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">لا توجد عمولات مسجلة بعد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-3 font-semibold">الطلب</th>
                            <th className="py-3 font-semibold">الشاحن / الناقل</th>
                            <th className="py-3 font-semibold">القيمة</th>
                            <th className="py-3 font-semibold">عمولة الشاحن</th>
                            <th className="py-3 font-semibold">عمولة الناقل</th>
                            <th className="py-3 font-semibold">الإجمالي</th>
                            <th className="py-3 font-semibold">التسوية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 tabular-nums">
                          {commissions.map((c) => (
                            <tr key={c.commissionId}>
                              <td className="py-3 font-mono">{c.shipmentReference}</td>
                              <td className="py-3">
                                <p>{c.shipperCompany}</p>
                                <p className="text-slate-500">{c.carrierCompany}</p>
                              </td>
                              <td className="py-3">{formatEgp(c.agreedPriceEgp)}</td>
                              <td className="py-3">{formatEgp(c.shipperFeeEgp)}</td>
                              <td className="py-3">{formatEgp(c.carrierFeeEgp)}</td>
                              <td className="py-3 font-bold text-slate-950">
                                {formatEgp(c.totalPlatformFeeEgp)}
                              </td>
                              <td className="py-3">
                                <select
                                  value={c.settlementStatus}
                                  onChange={(e) =>
                                    adminUpdateCommissionSettlement(
                                      c.commissionId,
                                      e.target.value as SettlementStatus
                                    )
                                  }
                                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                                >
                                  {Object.entries(SETTLEMENT_STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>
                                      {v}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complaints & Contact Messages */}
            {tab === 'complaints' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    مراجعة الشكاوى ({complaints.length})
                  </h2>
                  {complaints.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">لا توجد شكاوى مسجلة.</p>
                  ) : (
                    <div className="space-y-4">
                      {complaints.map((cmp) => (
                        <div key={cmp.complaintId} className="p-4 border border-slate-200 rounded-lg space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-slate-950 text-sm">{cmp.subject}</span>
                            <span className="text-slate-500">
                              {cmp.reporterName} ({cmp.reporterRole === 'shipper' ? 'صاحب شحنة' : 'ناقل'})
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{cmp.details}</p>
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <input
                              type="text"
                              value={noteDrafts[cmp.complaintId] ?? cmp.adminNote}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [cmp.complaintId]: e.target.value,
                                }))
                              }
                              placeholder="ملاحظة الإدارة للعميل..."
                              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                            />
                            <select
                              value={cmp.status}
                              onChange={(e) =>
                                adminUpdateComplaint(
                                  cmp.complaintId,
                                  e.target.value as ComplaintStatus,
                                  noteDrafts[cmp.complaintId] ?? cmp.adminNote
                                )
                              }
                              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                            >
                              {Object.entries(COMPLAINT_STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                adminUpdateComplaint(
                                  cmp.complaintId,
                                  cmp.status,
                                  noteDrafts[cmp.complaintId] ?? cmp.adminNote
                                )
                              }
                              className="px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 cursor-pointer"
                            >
                              حفظ الرد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    رسائل صفحة اتصل بنا ({contactMessages.length})
                  </h2>
                  {contactMessages.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">لا توجد رسائل تواصل.</p>
                  ) : (
                    <div className="divide-y divide-slate-200 border-t border-slate-200">
                      {contactMessages.map((msg) => (
                        <div key={msg.messageId} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-950">{msg.subject}</p>
                            <p className="text-xs text-slate-500">
                              {msg.senderName} · {msg.phone} · {msg.email}
                            </p>
                            <p className="text-xs text-slate-700">{msg.message}</p>
                          </div>
                          {msg.status === 'new' ? (
                            <button
                              type="button"
                              onClick={() => adminMarkContactReviewed(msg.messageId)}
                              className="px-3.5 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 shrink-0 cursor-pointer"
                            >
                              تمت المراجعة
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold shrink-0">
                              تمت المراجعة
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
