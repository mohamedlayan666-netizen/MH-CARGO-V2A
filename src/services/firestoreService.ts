import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { DEFAULT_COMMISSION_SETTINGS, generateId, generateReferenceCode } from '../lib/constants';
import {
  buildOfferPayload,
  buildShipmentPayload,
  buildTruckPayload,
  calculateCommissionBreakdown,
} from '../lib/domainLogic';
import type {
  AccountStatus,
  CarrierProfile,
  CommissionLedger,
  Complaint,
  ComplaintStatus,
  ContactMessage,
  ContainerSize,
  ContainerType,
  Offer,
  PlatformSetting,
  PortId,
  SettlementStatus,
  Shipment,
  ShipmentStatus,
  TrailerType,
  TransportDirection,
  Truck,
  TruckStatus,
  UserProfile,
  UserRole,
  VerificationStatus,
} from '../types/domain';

async function isCurrentUserAdmin(uid: string): Promise<boolean> {
  const email = auth.currentUser?.email?.toLowerCase();
  if (auth.currentUser?.emailVerified && email === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const adminSnap = await getDoc(doc(db, 'admins', uid)).catch(() => null);
  return Boolean(adminSnap?.exists());
}

async function assertActiveUserRole(
  uid: string,
  expectedRole: UserRole,
  allowAdminOverride = false
): Promise<UserProfile | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) {
    if (allowAdminOverride && (await isCurrentUserAdmin(uid))) {
      return null;
    }
    throw new Error('يرجى استكمال تسجيل بيانات الحساب أولاً.');
  }

  const profile = userSnap.data() as UserProfile;
  if (profile.accountStatus !== 'active') {
    if (profile.accountStatus === 'suspended') {
      throw new Error('حسابك معلق إدارياً ولا يمكنك تنفيذ هذه العملية.');
    }
    throw new Error('حسابك قيد المراجعة الإدارية ولم يتم تفعيله بعد.');
  }

  if (profile.role !== expectedRole) {
    if (allowAdminOverride && (await isCurrentUserAdmin(uid))) {
      return profile;
    }
    throw new Error('صلاحية الحساب الحالي لا تسمح بتنفيذ هذا الإجراء.');
  }

  return profile;
}

async function assertApprovedCarrier(uid: string): Promise<CarrierProfile> {
  const carrierSnap = await getDoc(doc(db, 'carrierProfiles', uid));
  if (!carrierSnap.exists()) {
    throw new Error('يرجى استكمال ملف شركة النقل وانتظار اعتماد الإدارة قبل تقديم العروض.');
  }
  const carrierProfile = carrierSnap.data() as CarrierProfile;
  if (carrierProfile.verificationStatus !== 'approved') {
    throw new Error('حساب شركة النقل غير معتمد بعد من إدارة المنصة.');
  }
  return carrierProfile;
}

async function fetchAuthoritativeCommissionSettings(): Promise<PlatformSetting> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'commissions'));
    if (snap.exists()) {
      return snap.data() as PlatformSetting;
    }
  } catch {
    // Fall back to default platform settings if not yet seeded
  }
  return {
    ...DEFAULT_COMMISSION_SETTINGS,
    updatedBy: 'system',
  };
}

// =========================================================
// Shipments
// =========================================================

export interface CreateShipmentInput {
  shipperCompany: string;
  port: PortId;
  direction: TransportDirection;
  terminalGate: string;
  deliveryLocation: string;
  deliveryGovernorate: string;
  containerSize: ContainerSize;
  containerType: ContainerType;
  containerCount: number;
  cargoWeightTons: number;
  cargoDescription: string;
  instructions: string;
  pickupDate: string;
  targetBudgetEgp: number;
}

export async function createShipment(input: CreateShipmentInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  await assertActiveUserRole(uid, 'shipper', true);

  const shipmentId = generateId('shp');
  const referenceCode = generateReferenceCode();
  const payload = {
    ...buildShipmentPayload({
      shipmentId,
      referenceCode,
      shipperId: uid,
      shipperCompany: input.shipperCompany,
      port: input.port,
      direction: input.direction,
      terminalGate: input.terminalGate,
      deliveryLocation: input.deliveryLocation,
      deliveryGovernorate: input.deliveryGovernorate,
      containerSize: input.containerSize,
      containerType: input.containerType,
      containerCount: input.containerCount,
      cargoWeightTons: input.cargoWeightTons,
      cargoDescription: input.cargoDescription,
      instructions: input.instructions,
      pickupDate: input.pickupDate,
      targetBudgetEgp: input.targetBudgetEgp,
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'shipments', shipmentId), payload);
    return shipmentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `shipments/${shipmentId}`);
  }
}

function sortByCreatedAtDesc<T extends { createdAt?: { toMillis?: () => number } }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tB - tA;
  });
}

export function subscribeShipperShipments(
  shipperId: string,
  callback: (items: Shipment[]) => void
): Unsubscribe {
  const q = query(collection(db, 'shipments'), where('shipperId', '==', shipperId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Shipment)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shipments');
    }
  );
}

export function subscribeOpenShipments(callback: (items: Shipment[]) => void): Unsubscribe {
  const q = query(collection(db, 'shipments'), where('status', '==', 'open'));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Shipment)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shipments');
    }
  );
}

export function subscribeCarrierAssignedShipments(
  carrierId: string,
  callback: (items: Shipment[]) => void
): Unsubscribe {
  const q = query(collection(db, 'shipments'), where('acceptedCarrierId', '==', carrierId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Shipment)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shipments');
    }
  );
}

export function subscribeAllShipmentsAdmin(callback: (items: Shipment[]) => void): Unsubscribe {
  const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Shipment));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shipments');
    }
  );
}

export function subscribeShipmentById(
  shipmentId: string,
  callback: (shipment: Shipment | null) => void,
  onError?: () => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'shipments', shipmentId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as Shipment) : null);
    },
    (error) => {
      if (onError) {
        console.error('Shipment read denied or failed:', error);
        onError();
        return;
      }
      handleFirestoreError(error, OperationType.GET, `shipments/${shipmentId}`);
    }
  );
}

export async function cancelOpenShipment(shipmentId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'shipments', shipmentId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `shipments/${shipmentId}`);
  }
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'shipments', shipmentId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `shipments/${shipmentId}`);
  }
}

// =========================================================
// Offers & Atomic Acceptance with Commission Recording
// =========================================================

export interface SubmitOfferInput {
  shipment: Shipment;
  carrierCompany: string;
  truck: Truck;
  priceEgp: number;
  estimatedHours: number;
  notes: string;
}

export async function submitOffer(input: SubmitOfferInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  await assertActiveUserRole(uid, 'carrier', false);
  await assertApprovedCarrier(uid);

  if (input.truck.carrierId !== uid) {
    throw new Error('الشاحنة المختارة لا تتبع حسابك.');
  }

  const shipmentSnap = await getDoc(doc(db, 'shipments', input.shipment.shipmentId));
  if (!shipmentSnap.exists()) {
    throw new Error('طلب النقل غير موجود.');
  }
  const liveShipment = shipmentSnap.data() as Shipment;
  if (liveShipment.status !== 'open') {
    throw new Error('هذا الطلب لم يعد مفتوحاً لتلقي عروض الأسعار.');
  }
  if (liveShipment.shipperId === uid) {
    throw new Error('لا يمكنك تقديم عرض سعر على طلب نقل يخصك.');
  }

  const settings = await fetchAuthoritativeCommissionSettings();
  if (input.priceEgp < settings.minOrderValueEgp) {
    throw new Error(`الحد الأدنى لقيمة العرض هو ${settings.minOrderValueEgp} ج.م.`);
  }

  // Deterministic ID prevents duplicate offers by the same carrier on the same shipment
  const offerId = `${liveShipment.shipmentId}__${uid}`;
  const truckLabel = `${input.truck.tractorModel} (${input.truck.plateNumber})`.slice(0, 120);

  const built = buildOfferPayload({
    offerId,
    shipmentId: liveShipment.shipmentId,
    shipmentReference: liveShipment.referenceCode,
    shipperId: liveShipment.shipperId,
    carrierId: uid,
    carrierCompany: input.carrierCompany,
    truckId: input.truck.truckId,
    truckLabel,
    priceEgp: input.priceEgp,
    estimatedHours: input.estimatedHours,
    notes: input.notes,
  });

  const existingOfferSnap = await getDoc(doc(db, 'offers', offerId));
  if (existingOfferSnap.exists()) {
    const existingOffer = existingOfferSnap.data() as Offer;
    if (existingOffer.status !== 'withdrawn') {
      throw new Error('لقد قدمت عرض سعر بالفعل على هذا الطلب ولا يمكن تكرار العرض.');
    }

    try {
      await updateDoc(doc(db, 'offers', offerId), {
        carrierCompany: built.carrierCompany,
        truckId: built.truckId,
        truckLabel: built.truckLabel,
        priceEgp: built.priceEgp,
        estimatedHours: built.estimatedHours,
        notes: built.notes,
        status: 'pending',
        updatedAt: serverTimestamp(),
      });
      return offerId;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `offers/${offerId}`);
    }
  }

  const payload = {
    ...built,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'offers', offerId), payload);
    return offerId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `offers/${offerId}`);
  }
}

export function subscribeOffersForShipment(
  shipmentId: string,
  shipperId: string,
  callback: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('shipperId', '==', shipperId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Offer)
        .filter((o) => o.shipmentId === shipmentId);
      callback(sortByCreatedAtDesc(items));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeCarrierOfferForShipment(
  shipmentId: string,
  carrierId: string,
  callback: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('carrierId', '==', carrierId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Offer)
        .filter((o) => o.shipmentId === shipmentId);
      callback(sortByCreatedAtDesc(items));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeShipperOffers(
  shipperId: string,
  callback: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('shipperId', '==', shipperId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Offer)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeCarrierOffers(
  carrierId: string,
  callback: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('carrierId', '==', carrierId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Offer)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeAllOffersAdmin(callback: (offers: Offer[]) => void): Unsubscribe {
  const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Offer));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export async function rejectOffer(offerId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'offers', offerId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `offers/${offerId}`);
  }
}

export async function withdrawOffer(offerId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'offers', offerId), {
      status: 'withdrawn',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `offers/${offerId}`);
  }
}

/**
 * Atomically accepts a carrier offer and assigns the shipment.
 * Note on client-side boundaries: Firestore rules block untrusted clients (shippers/carriers)
 * from creating or modifying `commissions` documents. Only a trusted admin (or a backend Cloud Function
 * using Firebase Admin SDK) can create the `commissions/{shipmentId}` ledger document.
 */
export async function acceptOfferAndRecordCommission(
  shipment: Shipment,
  offer: Offer,
  _otherPendingOffers: Offer[],
  _commissionSettings: PlatformSetting
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  const isTrustedAdmin = await isCurrentUserAdmin(uid);
  await assertActiveUserRole(uid, 'shipper', true);

  // Re-fetch authoritative documents before constructing the atomic batch
  const [shipmentSnap, offerSnap, authoritativeSettings] = await Promise.all([
    getDoc(doc(db, 'shipments', shipment.shipmentId)),
    getDoc(doc(db, 'offers', offer.offerId)),
    fetchAuthoritativeCommissionSettings(),
  ]);

  if (!shipmentSnap.exists()) {
    throw new Error('طلب النقل غير موجود.');
  }
  const liveShipment = shipmentSnap.data() as Shipment;
  if (!isTrustedAdmin && liveShipment.shipperId !== uid) {
    throw new Error('لا تملك صلاحية ترسية هذا الطلب.');
  }
  if (liveShipment.status !== 'open') {
    throw new Error('تمت ترسية أو إغلاق هذا الطلب مسبقاً.');
  }

  if (!offerSnap.exists()) {
    throw new Error('عرض السعر المحدد غير موجود.');
  }
  const liveOffer = offerSnap.data() as Offer;
  if (
    liveOffer.shipmentId !== liveShipment.shipmentId ||
    liveOffer.shipperId !== liveShipment.shipperId ||
    liveOffer.status !== 'pending'
  ) {
    throw new Error('عرض السعر لم يعد متاحاً للقبول.');
  }
  if (liveOffer.carrierId === liveShipment.shipperId) {
    throw new Error('لا يمكن قبول عرض مقدم من نفس صاحب الشحنة.');
  }

  await assertApprovedCarrier(liveOffer.carrierId);

  const commissionId = liveShipment.shipmentId;
  if (isTrustedAdmin) {
    const commissionSnap = await getDoc(doc(db, 'commissions', commissionId));
    if (commissionSnap.exists()) {
      throw new Error('تم تسجيل عمولة مسبقة لهذا الطلب ولا يمكن تكرار العمولة.');
    }
  }

  const breakdown = calculateCommissionBreakdown(liveOffer.priceEgp, authoritativeSettings);
  const {
    agreedPriceEgp,
    shipperRatePercent: shipperRate,
    carrierRatePercent: carrierRate,
    shipperFeeEgp,
    carrierFeeEgp,
    totalPlatformFeeEgp,
    totalShipperPayableEgp,
    netCarrierPayoutEgp,
  } = breakdown;

  // Fetch fresh pending offers for this shipment so concurrent pending offers are also rejected
  const shipperOffersSnap = await getDocs(
    query(collection(db, 'offers'), where('shipperId', '==', liveShipment.shipperId))
  );
  const pendingIds = new Set<string>();
  shipperOffersSnap.docs.forEach((d) => {
    const o = d.data() as Offer;
    if (
      o.shipmentId === liveShipment.shipmentId &&
      o.status === 'pending' &&
      o.offerId !== liveOffer.offerId
    ) {
      pendingIds.add(o.offerId);
    }
  });

  const batch = writeBatch(db);

  // 1. Mark accepted offer
  batch.update(doc(db, 'offers', liveOffer.offerId), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  // 2. Reject other live pending offers on this shipment
  for (const otherOfferId of pendingIds) {
    batch.update(doc(db, 'offers', otherOfferId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Assign shipment with server-verified authoritative price & commission breakdown
  batch.update(doc(db, 'shipments', liveShipment.shipmentId), {
    status: 'assigned',
    acceptedOfferId: liveOffer.offerId,
    acceptedCarrierId: liveOffer.carrierId,
    acceptedCarrierCompany: liveOffer.carrierCompany,
    agreedPriceEgp,
    shipperCommissionRate: shipperRate,
    carrierCommissionRate: carrierRate,
    shipperCommissionEgp: shipperFeeEgp,
    carrierCommissionEgp: carrierFeeEgp,
    totalShipperPayableEgp,
    netCarrierPayoutEgp,
    updatedAt: serverTimestamp(),
  });

  // 4. Only a trusted authority (Admin here, or a Cloud Function via Admin SDK) may create commission records
  if (isTrustedAdmin) {
    batch.set(doc(db, 'commissions', commissionId), {
      commissionId,
      shipmentId: liveShipment.shipmentId,
      shipmentReference: liveShipment.referenceCode,
      offerId: liveOffer.offerId,
      shipperId: liveShipment.shipperId,
      shipperCompany: liveShipment.shipperCompany,
      carrierId: liveOffer.carrierId,
      carrierCompany: liveOffer.carrierCompany,
      agreedPriceEgp,
      shipperRatePercent: shipperRate,
      carrierRatePercent: carrierRate,
      shipperFeeEgp,
      carrierFeeEgp,
      totalPlatformFeeEgp,
      settlementStatus: 'recorded_pending_gateway',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `shipments/${liveShipment.shipmentId}`);
  }
}

// =========================================================
// Carrier Profile & Trucks Fleet
// =========================================================

export function subscribeOwnCarrierProfile(
  carrierId: string,
  callback: (profile: CarrierProfile | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'carrierProfiles', carrierId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as CarrierProfile) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `carrierProfiles/${carrierId}`);
    }
  );
}

export async function saveCarrierProfile(
  existing: CarrierProfile | null,
  input: {
    companyName: string;
    ownerName: string;
    city: string;
    servicePorts: PortId[];
    yearsExperience: number;
    description: string;
    truckCount: number;
  }
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  await assertActiveUserRole(uid, 'carrier', true);

  const ref = doc(db, 'carrierProfiles', uid);
  const safePorts: PortId[] = input.servicePorts.length > 0 ? input.servicePorts : ['alexandria'];

  if (!existing) {
    try {
      await setDoc(ref, {
        carrierId: uid,
        companyName: input.companyName.trim().slice(0, 120),
        ownerName: input.ownerName.trim().slice(0, 100),
        city: input.city.trim().slice(0, 80),
        servicePorts: safePorts,
        yearsExperience: Math.max(0, Math.min(100, Math.round(input.yearsExperience))),
        description: input.description.trim().slice(0, 800),
        verificationStatus: 'pending',
        truckCount: Math.max(0, Math.min(500, Math.round(input.truckCount))),
        completedTrips: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `carrierProfiles/${uid}`);
    }
  } else {
    try {
      await updateDoc(ref, {
        companyName: input.companyName.trim().slice(0, 120),
        ownerName: input.ownerName.trim().slice(0, 100),
        city: input.city.trim().slice(0, 80),
        servicePorts: safePorts,
        yearsExperience: Math.max(0, Math.min(100, Math.round(input.yearsExperience))),
        description: input.description.trim().slice(0, 800),
        truckCount: Math.max(0, Math.min(500, Math.round(input.truckCount))),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `carrierProfiles/${uid}`);
    }
  }
}

export function subscribeCarrierTrucks(
  carrierId: string,
  callback: (trucks: Truck[]) => void
): Unsubscribe {
  const q = query(collection(db, 'trucks'), where('carrierId', '==', carrierId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Truck)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trucks');
    }
  );
}

export interface CreateTruckInput {
  carrierCompany: string;
  plateNumber: string;
  tractorModel: string;
  trailerType: TrailerType;
  maxPayloadTons: number;
  supportedContainerSizes: ContainerSize[];
  driverName: string;
  driverPhone: string;
}

export async function createTruck(input: CreateTruckInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  await assertActiveUserRole(uid, 'carrier', true);
  if (!(await isCurrentUserAdmin(uid))) {
    await assertApprovedCarrier(uid);
  }

  const truckId = generateId('trk');
  const payload = {
    ...buildTruckPayload({
      truckId,
      carrierId: uid,
      carrierCompany: input.carrierCompany,
      plateNumber: input.plateNumber,
      tractorModel: input.tractorModel,
      trailerType: input.trailerType,
      maxPayloadTons: input.maxPayloadTons,
      supportedContainerSizes: input.supportedContainerSizes,
      driverName: input.driverName,
      driverPhone: input.driverPhone,
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'trucks', truckId), payload);
    return truckId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `trucks/${truckId}`);
  }
}

export async function updateTruckStatus(truckId: string, status: TruckStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'trucks', truckId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trucks/${truckId}`);
  }
}

export async function deleteTruck(truckId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'trucks', truckId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trucks/${truckId}`);
  }
}

// =========================================================
// Commissions, Complaints & Contact
// =========================================================

export function subscribeUserCommissions(
  uid: string,
  role: UserRole,
  callback: (items: CommissionLedger[]) => void
): Unsubscribe {
  const field = role === 'shipper' ? 'shipperId' : 'carrierId';
  const q = query(collection(db, 'commissions'), where(field, '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as CommissionLedger)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'commissions');
    }
  );
}

export function subscribeOwnComplaints(
  uid: string,
  callback: (items: Complaint[]) => void
): Unsubscribe {
  const q = query(collection(db, 'complaints'), where('reporterId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortByCreatedAtDesc(snap.docs.map((d) => d.data() as Complaint)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'complaints');
    }
  );
}

export async function createComplaint(input: {
  reporterName: string;
  reporterRole: UserRole;
  shipmentId?: string;
  subject: string;
  details: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يجب تسجيل الدخول أولاً.');

  const complaintId = generateId('cmp');
  try {
    await setDoc(doc(db, 'complaints', complaintId), {
      complaintId,
      reporterId: uid,
      reporterName: input.reporterName.trim().slice(0, 100),
      reporterRole: input.reporterRole,
      shipmentId: (input.shipmentId || '').trim().slice(0, 128),
      subject: input.subject.trim().slice(0, 150),
      details: input.details.trim().slice(0, 2000),
      status: 'open',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return complaintId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `complaints/${complaintId}`);
  }
}

export async function submitContactMessage(input: {
  senderName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('يرجى تسجيل الدخول لإرسال الرسالة مباشرة عبر المنصة.');

  const messageId = generateId('msg');
  try {
    await setDoc(doc(db, 'contactMessages', messageId), {
      messageId,
      senderId: uid,
      senderName: input.senderName.trim().slice(0, 100),
      email: input.email.trim().slice(0, 150),
      phone: input.phone.trim().slice(0, 30),
      subject: input.subject.trim().slice(0, 150),
      message: input.message.trim().slice(0, 2000),
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return messageId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `contactMessages/${messageId}`);
  }
}

// =========================================================
// Admin Operations
// =========================================================

export function subscribeAllUsersAdmin(callback: (users: UserProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as UserProfile)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'users')
  );
}

export function subscribeAllCarrierProfilesAdmin(
  callback: (profiles: CarrierProfile[]) => void
): Unsubscribe {
  const q = query(collection(db, 'carrierProfiles'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as CarrierProfile)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'carrierProfiles')
  );
}

export function subscribeAllCommissionsAdmin(
  callback: (items: CommissionLedger[]) => void
): Unsubscribe {
  const q = query(collection(db, 'commissions'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as CommissionLedger)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'commissions')
  );
}

export function subscribeAllComplaintsAdmin(callback: (items: Complaint[]) => void): Unsubscribe {
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as Complaint)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'complaints')
  );
}

export function subscribeAllContactMessagesAdmin(
  callback: (items: ContactMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as ContactMessage)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'contactMessages')
  );
}

export async function adminUpdateUserAccountStatus(
  uid: string,
  accountStatus: AccountStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      accountStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminUpdateCarrierVerification(
  carrierId: string,
  verificationStatus: VerificationStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'carrierProfiles', carrierId), {
      verificationStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `carrierProfiles/${carrierId}`);
  }
}

export async function adminSaveCommissionSettings(input: {
  shipperCommissionPercent: number;
  carrierCommissionPercent: number;
  minOrderValueEgp: number;
}): Promise<void> {
  const uid = auth.currentUser?.uid || 'admin';
  try {
    await setDoc(doc(db, 'platformSettings', 'commissions'), {
      settingId: 'commissions',
      shipperCommissionPercent: Math.max(0, Math.min(30, Number(input.shipperCommissionPercent))),
      carrierCommissionPercent: Math.max(0, Math.min(30, Number(input.carrierCommissionPercent))),
      minOrderValueEgp: Math.max(0, Math.min(1000000, Math.round(input.minOrderValueEgp))),
      paymentCollectionMode: 'manual_recording_no_gateway',
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'platformSettings/commissions');
  }
}

export async function adminUpdateCommissionSettlement(
  commissionId: string,
  settlementStatus: SettlementStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'commissions', commissionId), {
      settlementStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `commissions/${commissionId}`);
  }
}

export async function adminUpdateComplaint(
  complaintId: string,
  status: ComplaintStatus,
  adminNote: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'complaints', complaintId), {
      status,
      adminNote: adminNote.trim().slice(0, 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
  }
}

export async function adminMarkContactReviewed(messageId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'contactMessages', messageId), {
      status: 'reviewed',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contactMessages/${messageId}`);
  }
}

export async function fetchVerifiedCarriersCount(): Promise<number> {
  try {
    const q = query(
      collection(db, 'carrierProfiles'),
      where('verificationStatus', '==', 'approved')
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}
