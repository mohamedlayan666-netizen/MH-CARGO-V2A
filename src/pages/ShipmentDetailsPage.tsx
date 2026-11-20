import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Container,
  MapPin,
  Truck as TruckIcon,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  CONTAINER_SIZE_LABELS,
  CONTAINER_TYPE_LABELS,
  DIRECTION_LABELS,
  formatEgp,
  OFFER_STATUS_LABELS,
  PORT_LABELS,
  SHIPMENT_STATUS_LABELS,
} from '../lib/constants';
import {
  acceptOfferAndRecordCommission,
  cancelOpenShipment,
  createComplaint,
  rejectOffer,
  subscribeCarrierOfferForShipment,
  subscribeCarrierTrucks,
  subscribeOffersForShipment,
  subscribeShipmentById,
  submitOffer,
  updateShipmentStatus,
  withdrawOffer,
} from '../services/firestoreService';
import type { Offer, Shipment, ShipmentStatus, Truck } from '../types/domain';

export const ShipmentDetailsPage: React.FC = () => {
  const { shipmentId = '' } = useParams();
  const { firebaseUser, profile, isAdmin, commissionSettings } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myTrucks, setMyTrucks] = useState<Truck[]>([]);

  // Carrier offer form
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [priceEgp, setPriceEgp] = useState<number>(6500);
  const [estimatedHours, setEstimatedHours] = useState<number>(6);
  const [offerNotes, setOfferNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Complaint drawer
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');

  useEffect(() => {
    if (!shipmentId || !firebaseUser) {
      setLoading(false);
      return;
    }

    const unsub = subscribeShipmentById(
      shipmentId,
      (data) => {
        setShipment(data);
        setLoading(false);
      },
      () => {
        setShipment(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [shipmentId, firebaseUser]);

  const isShipperOwner = Boolean(
    firebaseUser && shipment && shipment.shipperId === firebaseUser.uid
  );
  const isCarrierUser = Boolean(profile?.role === 'carrier');
  const isAssignedCarrier = Boolean(
    firebaseUser && shipment && shipment.acceptedCarrierId === firebaseUser.uid
  );

  // Subscribe to relevant offers
  useEffect(() => {
    if (!shipment || !firebaseUser) return;

    if (isShipperOwner || isAdmin) {
      return subscribeOffersForShipment(shipment.shipmentId, shipment.shipperId, setOffers);
    } else if (isCarrierUser) {
      return subscribeCarrierOfferForShipment(shipment.shipmentId, firebaseUser.uid, setOffers);
    }
  }, [shipment, firebaseUser, isShipperOwner, isAdmin, isCarrierUser]);

  // Load carrier trucks if carrier
  useEffect(() => {
    if (!firebaseUser || !isCarrierUser) return;
    return subscribeCarrierTrucks(firebaseUser.uid, (list) => {
      setMyTrucks(list);
      if (list.length > 0 && !selectedTruckId) {
        setSelectedTruckId(list[0].truckId);
      }
    });
  }, [firebaseUser, isCarrierUser, selectedTruckId]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            يلزم تسجيل الدخول لعرض تفاصيل الطلب
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            يرجى تسجيل الدخول لاستعراض تفاصيل طلب نقل الحاوية وتقديم أو إدارة عروض الأسعار.
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        جارٍ تحميل بيانات الطلب...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-xl font-bold text-slate-950 mb-2">
            لم يتم العثور على الطلب
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            ربما تم إغلاق الطلب أو ليست لديك صلاحية الاطلاع عليه.
          </p>
          <Link to="/" className="text-sm font-semibold text-orange-600 hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const backPath = isAdmin ? '/admin' : isCarrierUser ? '/carrier' : '/shipper';
  const myActiveOffer = offers.find((o) => o.carrierId === firebaseUser.uid && o.status !== 'withdrawn');

  const handleAcceptOffer = async (offer: Offer) => {
    setError('');
    setFeedback('');
    setActionLoading(true);
    try {
      await acceptOfferAndRecordCommission(shipment, offer, offers, commissionSettings);
      setFeedback(`تم قبول عرض شركة ${offer.carrierCompany} وتسجيل العمولة بنجاح.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر قبول العرض.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setError('');
    setActionLoading(true);
    try {
      await rejectOffer(offerId);
      setFeedback('تم رفض العرض.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر رفض العرض.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawOffer = async (offerId: string) => {
    setError('');
    setActionLoading(true);
    try {
      await withdrawOffer(offerId);
      setFeedback('تم سحب عرض السعر.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر سحب العرض.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelShipment = async () => {
    setError('');
    setActionLoading(true);
    try {
      await cancelOpenShipment(shipment.shipmentId);
      setFeedback('تم إلغاء طلب النقل.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إلغاء الطلب.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: ShipmentStatus) => {
    setError('');
    setActionLoading(true);
    try {
      await updateShipmentStatus(shipment.shipmentId, nextStatus);
      setFeedback(`تم تحديث حالة الطلب إلى: ${SHIPMENT_STATUS_LABELS[nextStatus]}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث الحالة.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFeedback('');

    const chosenTruck = myTrucks.find((t) => t.truckId === selectedTruckId);
    if (!chosenTruck) {
      setError('يرجى اختيار شاحنة مسجلة من أسطولك أولاً.');
      return;
    }

    if (priceEgp < commissionSettings.minOrderValueEgp) {
      setError(`الحد الأدنى لقيمة العرض هو ${formatEgp(commissionSettings.minOrderValueEgp)}.`);
      return;
    }

    setActionLoading(true);
    try {
      await submitOffer({
        shipment,
        carrierCompany: profile?.companyName || chosenTruck.carrierCompany,
        truck: chosenTruck,
        priceEgp,
        estimatedHours,
        notes: offerNotes,
      });
      setFeedback('تم إرسال عرض السعر إلى صاحب الشحنة بنجاح.');
      setOfferNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال العرض.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setActionLoading(true);
    try {
      await createComplaint({
        reporterName: profile.displayName,
        reporterRole: profile.role,
        shipmentId: shipment.shipmentId,
        subject: complaintSubject,
        details: complaintDetails,
      });
      setShowComplaint(false);
      setComplaintSubject('');
      setComplaintDetails('');
      setFeedback('تم تسجيل الشكوى وإرسالها إلى إدارة المنصة للمراجعة.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الشكوى.');
    } finally {
      setActionLoading(false);
    }
  };

  const carrierCommissionPreview = Math.round(
    (priceEgp * commissionSettings.carrierCommissionPercent) / 100
  );
  const carrierNetPreview = Math.max(0, priceEgp - carrierCommissionPreview);

  return (
    <div className="bg-slate-50 py-10 lg:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى لوحة التحكم</span>
          </Link>

          {profile && (
            <button
              type="button"
              onClick={() => setShowComplaint((prev) => !prev)}
              className="text-xs font-semibold text-slate-600 hover:text-orange-600 underline underline-offset-4 cursor-pointer"
            >
              تقديم شكوى بخصوص الطلب
            </button>
          )}
        </div>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Form */}
        {showComplaint && (
          <form
            onSubmit={handleSubmitComplaint}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-slate-950">
              تسجيل شكوى مرتبطة بالطلب {shipment.referenceCode}
            </h2>
            <input
              type="text"
              required
              value={complaintSubject}
              onChange={(e) => setComplaintSubject(e.target.value)}
              placeholder="عنوان الشكوى (مثال: تأخير عند البوابة أو اختلاف بيانات)"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
            />
            <textarea
              rows={3}
              required
              value={complaintDetails}
              onChange={(e) => setComplaintDetails(e.target.value)}
              placeholder="اشرح تفاصيل المشكلة ليتمكن فريق الإدارة من المراجعة..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
              >
                إرسال الشكوى للإدارة
              </button>
              <button
                type="button"
                onClick={() => setShowComplaint(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-950 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </form>
        )}

        {/* Shipment Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-mono font-semibold text-slate-900">
                  {shipment.referenceCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{shipment.shipperCompany}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">تاريخ السحب: {shipment.pickupDate}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950">
                {PORT_LABELS[shipment.port]} — {shipment.deliveryGovernorate}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-orange-600">
                {SHIPMENT_STATUS_LABELS[shipment.status]}
              </span>
              {(isShipperOwner || isAdmin) && shipment.status === 'open' && (
                <button
                  type="button"
                  onClick={handleCancelShipment}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-300 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  إلغاء الطلب
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-slate-200 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">اتجاه التشغيل</p>
              <p className="font-semibold text-slate-900">{DIRECTION_LABELS[shipment.direction]}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">البوابة / المحطة</p>
              <p className="font-semibold text-slate-900">{shipment.terminalGate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">مواصفات الحاوية</p>
              <p className="font-semibold text-slate-900 tabular-nums">
                {shipment.containerCount} × {CONTAINER_SIZE_LABELS[shipment.containerSize]}
              </p>
              <p className="text-xs text-slate-500">{CONTAINER_TYPE_LABELS[shipment.containerType]}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">الوزن والميزانية الاسترشادية</p>
              <p className="font-semibold text-slate-900 tabular-nums">
                {shipment.cargoWeightTons} طن
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {shipment.targetBudgetEgp > 0
                  ? `ميزانية: ${formatEgp(shipment.targetBudgetEgp)}`
                  : 'مفتوح لأفضل عرض'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-1">موقع التسليم / التحميل التفصيلي</p>
                <p className="font-medium text-slate-900">
                  {shipment.deliveryGovernorate} — {shipment.deliveryLocation}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Container className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-1">وصف الحمولة والتعليمات</p>
                <p className="font-medium text-slate-900">{shipment.cargoDescription}</p>
                {shipment.instructions && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {shipment.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Assigned / Execution Financial & Status Controls */}
          {shipment.status !== 'open' && shipment.status !== 'cancelled' && (
            <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50 rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">الشركة الناقلة المعينة والتسوية المسجلة</p>
                  <p className="font-display text-lg font-bold text-slate-950">
                    {shipment.acceptedCarrierCompany}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 tabular-nums pt-1">
                    <span>قيمة النقل المتفق عليها: {formatEgp(shipment.agreedPriceEgp)}</span>
                    {(isShipperOwner || isAdmin) && (
                      <span>
                        عمولة الشاحن ({shipment.shipperCommissionRate}%):{' '}
                        {formatEgp(shipment.shipperCommissionEgp)} · الإجمالي:{' '}
                        {formatEgp(shipment.totalShipperPayableEgp)}
                      </span>
                    )}
                    {(isAssignedCarrier || isAdmin) && (
                      <span>
                        عمولة الناقل ({shipment.carrierCommissionRate}%):{' '}
                        {formatEgp(shipment.carrierCommissionEgp)} · الصافي للناقل:{' '}
                        {formatEgp(shipment.netCarrierPayoutEgp)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Execution Status Progression Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {isAssignedCarrier && shipment.status === 'assigned' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('in_transit')}
                      className="px-4 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      تحديث الحالة: في الطريق
                    </button>
                  )}
                  {isAssignedCarrier && shipment.status === 'in_transit' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('at_gate')}
                      className="px-4 py-2.5 bg-slate-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      تحديث الحالة: على البوابة / التحميل
                    </button>
                  )}
                  {isAssignedCarrier &&
                    (shipment.status === 'in_transit' || shipment.status === 'at_gate') && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdvanceStatus('delivered')}
                        className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        تأكيد التسليم بالموقع
                      </button>
                    )}
                  {isShipperOwner && shipment.status === 'delivered' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAdvanceStatus('completed')}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      تأكيد استلام الحاوية وإغلاق الطلب
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipper View: Received Offers */}
        {(isShipperOwner || isAdmin) && (
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  عروض الأسعار المقدمة ({offers.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تُضاف عمولة صاحب الشحنة ({commissionSettings.shipperCommissionPercent}%) عند قبول العرض وتُسجل في قاعدة البيانات بدون خصم إلكتروني.
                </p>
              </div>
            </div>

            {offers.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  لم تصل عروض أسعار على هذا الطلب حتى الآن
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  يظهر الطلب الآن للناقلين المعتمدين في {PORT_LABELS[shipment.port]}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border-t border-slate-200">
                {offers.map((offer) => {
                  const shipperFee = Math.round(
                    (offer.priceEgp * commissionSettings.shipperCommissionPercent) / 100
                  );
                  const totalPayable = offer.priceEgp + shipperFee;

                  return (
                    <div
                      key={offer.offerId}
                      className="py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-950 text-sm">
                            {offer.carrierCompany}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{offer.truckLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-orange-600">
                            {OFFER_STATUS_LABELS[offer.status]}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 tabular-nums">
                          <span>سعر العرض: {formatEgp(offer.priceEgp)}</span>
                          <span>
                            عمولة المنصة: {formatEgp(shipperFee)} (
                            {commissionSettings.shipperCommissionPercent}%)
                          </span>
                          <span className="font-semibold text-slate-950">
                            الإجمالي المستحق: {formatEgp(totalPayable)}
                          </span>
                          <span>المدة المقدرة: {offer.estimatedHours} ساعة</span>
                        </div>

                        {offer.notes && (
                          <p className="text-xs text-slate-600">{offer.notes}</p>
                        )}
                      </div>

                      {shipment.status === 'open' && offer.status === 'pending' && isShipperOwner && (
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAcceptOffer(offer)}
                            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            قبول العرض وترسية الطلب
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleRejectOffer(offer.offerId)}
                            className="px-4 py-2.5 border border-slate-300 hover:border-red-400 text-slate-700 hover:text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Carrier View: Submit Offer or Manage Existing Offer */}
        {isCarrierUser && shipment.status === 'open' && (
          <div className="bg-white border border-slate-200 rounded-xl p-7">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-4">
              تقديم عرض سعر لتنفيذ الطلب
            </h2>

            {myActiveOffer ? (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-950">
                    لقد قدمت عرضاً بقيمة {formatEgp(myActiveOffer.priceEgp)}
                  </p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    الشاحنة: {myActiveOffer.truckLabel} · الحالة:{' '}
                    {OFFER_STATUS_LABELS[myActiveOffer.status]}
                  </p>
                </div>
                {myActiveOffer.status === 'pending' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleWithdrawOffer(myActiveOffer.offerId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>سحب العرض</span>
                  </button>
                )}
              </div>
            ) : myTrucks.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center">
                <TruckIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  لا توجد شاحنات مسجلة في أسطولك بعد
                </p>
                <p className="text-xs text-slate-600 mb-4">
                  أضف بيانات الجرار والشاسيه والسائق من لوحة الناقل لتتمكن من تقديم عروض الأسعار.
                </p>
                <Link
                  to="/carrier"
                  className="inline-flex px-5 py-2.5 bg-slate-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  إضافة شاحنة في لوحة الناقل
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitOffer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      الشاحنة والجرار المخصص
                    </label>
                    <select
                      value={selectedTruckId}
                      onChange={(e) => setSelectedTruckId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-950"
                    >
                      {myTrucks.map((t) => (
                        <option key={t.truckId} value={t.truckId}>
                          {t.tractorModel} — {t.plateNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      قيمة عرض السعر (ج.م)
                    </label>
                    <input
                      type="number"
                      min={commissionSettings.minOrderValueEgp}
                      step={50}
                      required
                      value={priceEgp}
                      onChange={(e) => setPriceEgp(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      مدة التوصيل المقدرة (بالساعات)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      required
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ملاحظات العرض للعميل (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="مثال: الشاحنة متواجدة بالقرب من باب 27 ومجهزة لبدء التحميل فوراً"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950"
                  />
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-700 tabular-nums">
                  <span>
                    عمولة المنصة على الناقل ({commissionSettings.carrierCommissionPercent}%):{' '}
                    <strong>{formatEgp(carrierCommissionPreview)}</strong>
                  </span>
                  <span>
                    صافي المستحق لك بعد العمولة:{' '}
                    <strong className="text-slate-950">{formatEgp(carrierNetPreview)}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-7 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {actionLoading ? 'جارٍ الإرسال...' : 'تقديم عرض السعر'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
