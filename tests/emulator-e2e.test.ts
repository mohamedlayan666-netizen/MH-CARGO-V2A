import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { calculateCommissionBreakdown } from '../src/lib/domainLogic';

// NOTE: Runs 100% isolated inside Firebase Local Emulator with an offline demo project ID.
// Never reads firebase-applet-config.json and never connects to production Firestore.
const EMULATOR_PROJECT_ID = 'demo-mh-cargo-test';
const EMULATOR_FIREBASE_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: EMULATOR_PROJECT_ID,
};

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;

function makeEmulatorClient(name: string) {
  const app = initializeApp(EMULATOR_FIREBASE_CONFIG, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
  return { app, auth, db };
}

async function signInVerifiedEmulatorUser(auth: ReturnType<typeof getAuth>, email: string, sub: string) {
  // Sign in via Auth Emulator Google IdP mock token (email_verified = true)
  const idToken = JSON.stringify({
    sub,
    email,
    email_verified: true,
    name: email.split('@')[0],
  });
  const cred = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, cred);
}

async function seedEmulatorAdmin(uid: string, email: string) {
  const res = await fetch(
    `http://${FIRESTORE_HOST}:${FIRESTORE_PORT}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/admins/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer owner',
      },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: email },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to seed emulator admin: ${res.status}`);
  }
}

describe('MH CARGO Isolated Emulator Full Operational & Security E2E Suite', () => {
  const shipperClient = makeEmulatorClient('emu-shipper');
  const carrierClient = makeEmulatorClient('emu-carrier');
  const unapprovedCarrierClient = makeEmulatorClient('emu-carrier-pending');
  const suspendedUserClient = makeEmulatorClient('emu-suspended');
  const pendingReviewUserClient = makeEmulatorClient('emu-pending-review');
  const adminClient = makeEmulatorClient('emu-admin');

  const shipmentId = 'shp_emu_001';
  const shipmentTamperId = 'shp_emu_tamper_002';
  const truckId = 'trk_emu_001';
  const unapprovedTruckId = 'trk_emu_unapproved_002';

  after(async () => {
    await terminate(shipperClient.db).catch(() => {});
    await terminate(carrierClient.db).catch(() => {});
    await terminate(unapprovedCarrierClient.db).catch(() => {});
    await terminate(suspendedUserClient.db).catch(() => {});
    await terminate(pendingReviewUserClient.db).catch(() => {});
    await terminate(adminClient.db).catch(() => {});
    await deleteApp(shipperClient.app).catch(() => {});
    await deleteApp(carrierClient.app).catch(() => {});
    await deleteApp(unapprovedCarrierClient.app).catch(() => {});
    await deleteApp(suspendedUserClient.app).catch(() => {});
    await deleteApp(pendingReviewUserClient.app).catch(() => {});
    await deleteApp(adminClient.app).catch(() => {});
  });

  it('01. Creates isolated accounts and blocks self-admin escalation, self-role mutation, and non-active self-reactivation', async () => {
    const shipperCred = await signInVerifiedEmulatorUser(
      shipperClient.auth,
      'test-shipper@mhcargo.test',
      'emu_shipper_01'
    );
    const carrierCred = await signInVerifiedEmulatorUser(
      carrierClient.auth,
      'test-carrier@mhcargo.test',
      'emu_carrier_01'
    );
    const pendingCarrierCred = await signInVerifiedEmulatorUser(
      unapprovedCarrierClient.auth,
      'test-pending-carrier@mhcargo.test',
      'emu_carrier_pending_01'
    );
    const suspendedCred = await signInVerifiedEmulatorUser(
      suspendedUserClient.auth,
      'test-suspended@mhcargo.test',
      'emu_suspended_01'
    );
    const pendingReviewCred = await signInVerifiedEmulatorUser(
      pendingReviewUserClient.auth,
      'test-pending-review@mhcargo.test',
      'emu_pending_review_01'
    );
    const adminCred = await signInVerifiedEmulatorUser(
      adminClient.auth,
      'test-admin@mhcargo.test',
      'emu_admin_01'
    );
    await seedEmulatorAdmin(adminCred.user.uid, 'test-admin@mhcargo.test');

    // Shipper registration
    await setDoc(doc(shipperClient.db, 'users', shipperCred.user.uid), {
      uid: shipperCred.user.uid,
      displayName: 'اختبار صاحب شحنة',
      email: 'test-shipper@mhcargo.test',
      phone: '01011112222',
      companyName: 'شركة الاختبار للاستيراد',
      role: 'shipper',
      accountStatus: 'active',
      commercialRegister: '12345',
      city: 'الإسكندرية',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Approved carrier registration
    await setDoc(doc(carrierClient.db, 'users', carrierCred.user.uid), {
      uid: carrierCred.user.uid,
      displayName: 'اختبار ناقل',
      email: 'test-carrier@mhcargo.test',
      phone: '01033334444',
      companyName: 'شركة الاختبار للنقل',
      role: 'carrier',
      accountStatus: 'active',
      commercialRegister: '67890',
      city: 'الإسكندرية',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Pending/unapproved carrier registration
    await setDoc(doc(unapprovedCarrierClient.db, 'users', pendingCarrierCred.user.uid), {
      uid: pendingCarrierCred.user.uid,
      displayName: 'ناقل غير معتمد',
      email: 'test-pending-carrier@mhcargo.test',
      phone: '01055556666',
      companyName: 'شركة قيد المراجعة',
      role: 'carrier',
      accountStatus: 'active',
      commercialRegister: '55555',
      city: 'الإسكندرية',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Suspended user registration then suspended by admin
    await setDoc(doc(suspendedUserClient.db, 'users', suspendedCred.user.uid), {
      uid: suspendedCred.user.uid,
      displayName: 'حساب معلق',
      email: 'test-suspended@mhcargo.test',
      phone: '01077778888',
      companyName: 'شركة معلقة',
      role: 'shipper',
      accountStatus: 'active',
      commercialRegister: '77777',
      city: 'الإسكندرية',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(adminClient.db, 'users', suspendedCred.user.uid), {
      accountStatus: 'suspended',
      updatedAt: serverTimestamp(),
    });

    // Pending review user registration then marked pending_review by admin
    await setDoc(doc(pendingReviewUserClient.db, 'users', pendingReviewCred.user.uid), {
      uid: pendingReviewCred.user.uid,
      displayName: 'حساب قيد المراجعة',
      email: 'test-pending-review@mhcargo.test',
      phone: '01088889999',
      companyName: 'شركة مراجعة',
      role: 'shipper',
      accountStatus: 'active',
      commercialRegister: '88888',
      city: 'الإسكندرية',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(adminClient.db, 'users', pendingReviewCred.user.uid), {
      accountStatus: 'pending_review',
      updatedAt: serverTimestamp(),
    });

    // Negative Security Tests: Privilege & RBAC self-tampering
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'admins', shipperCred.user.uid), {
        uid: shipperCred.user.uid,
        email: 'test-shipper@mhcargo.test',
        createdAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      updateDoc(doc(shipperClient.db, 'users', shipperCred.user.uid), {
        role: 'carrier',
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      updateDoc(doc(suspendedUserClient.db, 'users', suspendedCred.user.uid), {
        accountStatus: 'active',
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      updateDoc(doc(pendingReviewUserClient.db, 'users', pendingReviewCred.user.uid), {
        accountStatus: 'active',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('02. Enforces strict active account status, initial shipment financials, RBAC guards, and carrier approval gate for trucks & offers', async () => {
    const shipperUid = shipperClient.auth.currentUser!.uid;
    const carrierUid = carrierClient.auth.currentUser!.uid;
    const pendingCarrierUid = unapprovedCarrierClient.auth.currentUser!.uid;

    // Admin seeds commission settings
    await setDoc(doc(adminClient.db, 'platformSettings', 'commissions'), {
      settingId: 'commissions',
      shipperCommissionPercent: 3.5,
      carrierCommissionPercent: 4.5,
      minOrderValueEgp: 1500,
      paymentCollectionMode: 'manual_recording_no_gateway',
      updatedBy: adminClient.auth.currentUser!.uid,
      updatedAt: serverTimestamp(),
    });

    // Negative: Non-admin cannot modify commission settings
    await assert.rejects(() =>
      updateDoc(doc(shipperClient.db, 'platformSettings', 'commissions'), {
        shipperCommissionPercent: 0,
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      updateDoc(doc(carrierClient.db, 'platformSettings', 'commissions'), {
        carrierCommissionPercent: 0,
        updatedAt: serverTimestamp(),
      })
    );

    const baseShipment = {
      referenceCode: 'MHC-2026-9999',
      shipperId: shipperUid,
      shipperCompany: 'شركة الاختبار للاستيراد',
      port: 'alexandria',
      direction: 'from_port',
      terminalGate: 'باب 27',
      deliveryLocation: 'برج العرب المنطقة الصناعية',
      deliveryGovernorate: 'الإسكندرية',
      containerSize: '40ft',
      containerType: 'dry',
      containerCount: 1,
      cargoWeightTons: 20,
      cargoDescription: 'خامات اختبارية',
      instructions: 'اختبار آلي',
      pickupDate: '2026-12-10',
      targetBudgetEgp: 8000,
      status: 'open',
      acceptedOfferId: '',
      acceptedCarrierId: '',
      acceptedCarrierCompany: '',
      agreedPriceEgp: 0,
      shipperCommissionRate: 0,
      carrierCommissionRate: 0,
      shipperCommissionEgp: 0,
      carrierCommissionEgp: 0,
      totalShipperPayableEgp: 0,
      netCarrierPayoutEgp: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Negative: Carrier, suspended user, and pending_review user cannot create a shipment
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'shipments', 'shp_illegal_carrier'), {
        ...baseShipment,
        shipmentId: 'shp_illegal_carrier',
        shipperId: carrierUid,
        shipperCompany: 'شركة الاختبار للنقل',
      })
    );
    await assert.rejects(() =>
      setDoc(doc(suspendedUserClient.db, 'shipments', 'shp_illegal_suspended'), {
        ...baseShipment,
        shipmentId: 'shp_illegal_suspended',
        shipperId: suspendedUserClient.auth.currentUser!.uid,
        shipperCompany: 'شركة معلقة',
      })
    );
    await assert.rejects(() =>
      setDoc(doc(pendingReviewUserClient.db, 'shipments', 'shp_illegal_pending_review'), {
        ...baseShipment,
        shipmentId: 'shp_illegal_pending_review',
        shipperId: pendingReviewUserClient.auth.currentUser!.uid,
        shipperCompany: 'شركة مراجعة',
      })
    );

    // Negative: pending_review user cannot file a complaint (isActiveUserAccount requires accountStatus == 'active')
    await assert.rejects(() =>
      setDoc(doc(pendingReviewUserClient.db, 'complaints', 'cmp_pending_review'), {
        complaintId: 'cmp_pending_review',
        reporterId: pendingReviewUserClient.auth.currentUser!.uid,
        reporterName: 'حساب قيد المراجعة',
        reporterRole: 'shipper',
        shipmentId: '',
        subject: 'شكوى من حساب غير مفعل',
        details: 'محاولة إرسال شكوى قبل التفعيل',
        status: 'open',
        adminNote: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Negative: Shipper cannot create a shipment with tampered/non-zero initial financial values or pre-assigned fields
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'shipments', 'shp_bad_init_price'), {
        ...baseShipment,
        shipmentId: 'shp_bad_init_price',
        agreedPriceEgp: 5000,
      })
    );
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'shipments', 'shp_bad_init_comm'), {
        ...baseShipment,
        shipmentId: 'shp_bad_init_comm',
        shipperCommissionEgp: 175,
        totalShipperPayableEgp: 175,
      })
    );
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'shipments', 'shp_bad_init_assign'), {
        ...baseShipment,
        shipmentId: 'shp_bad_init_assign',
        status: 'assigned',
        acceptedOfferId: 'off_fake',
        acceptedCarrierId: carrierUid,
      })
    );

    // Negative: Shipper cannot create carrierProfile or truck
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'carrierProfiles', shipperUid), {
        carrierId: shipperUid,
        companyName: 'شركة الاختبار للاستيراد',
        ownerName: 'اختبار',
        city: 'الإسكندرية',
        servicePorts: ['alexandria'],
        yearsExperience: 3,
        description: 'وصف',
        verificationStatus: 'pending',
        truckCount: 0,
        completedTrips: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'trucks', 'trk_illegal_shipper'), {
        truckId: 'trk_illegal_shipper',
        carrierId: shipperUid,
        carrierCompany: 'شركة الاختبار للاستيراد',
        plateNumber: 'س م أ 1111',
        tractorModel: 'فولفو',
        trailerType: 'skeleton_40',
        maxPayloadTons: 40,
        supportedContainerSizes: ['40ft'],
        driverName: 'سائق',
        driverPhone: '01000000001',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Valid Shipper creates shipments
    await setDoc(doc(shipperClient.db, 'shipments', shipmentId), { shipmentId, ...baseShipment });
    await setDoc(doc(shipperClient.db, 'shipments', shipmentTamperId), {
      shipmentId: shipmentTamperId,
      ...baseShipment,
      referenceCode: 'MHC-2026-9998',
    });

    // Carriers create profiles (initially pending)
    await setDoc(doc(carrierClient.db, 'carrierProfiles', carrierUid), {
      carrierId: carrierUid,
      companyName: 'شركة الاختبار للنقل',
      ownerName: 'اختبار ناقل',
      city: 'الإسكندرية',
      servicePorts: ['alexandria', 'dekheila'],
      yearsExperience: 7,
      description: 'أسطول نقل حاويات',
      verificationStatus: 'pending',
      truckCount: 1,
      completedTrips: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(unapprovedCarrierClient.db, 'carrierProfiles', pendingCarrierUid), {
      carrierId: pendingCarrierUid,
      companyName: 'شركة قيد المراجعة',
      ownerName: 'ناقل غير معتمد',
      city: 'الإسكندرية',
      servicePorts: ['alexandria'],
      yearsExperience: 2,
      description: 'قيد المراجعة',
      verificationStatus: 'pending',
      truckCount: 1,
      completedTrips: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Negative: Carrier cannot self-approve carrierProfile
    await assert.rejects(() =>
      updateDoc(doc(carrierClient.db, 'carrierProfiles', carrierUid), {
        verificationStatus: 'approved',
        updatedAt: serverTimestamp(),
      })
    );

    // Negative: Unapproved (pending) carriers CANNOT add trucks or submit offers
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'trucks', truckId), {
        truckId,
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        plateNumber: 'س م أ 9999',
        tractorModel: 'مرسيدس أكتروس',
        trailerType: 'skeleton_40',
        maxPayloadTons: 40,
        supportedContainerSizes: ['40ft'],
        driverName: 'سائق اختبار',
        driverPhone: '01099998888',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      setDoc(doc(unapprovedCarrierClient.db, 'trucks', unapprovedTruckId), {
        truckId: unapprovedTruckId,
        carrierId: pendingCarrierUid,
        carrierCompany: 'شركة قيد المراجعة',
        plateNumber: 'س م أ 7777',
        tractorModel: 'سكانيا',
        trailerType: 'skeleton_40',
        maxPayloadTons: 40,
        supportedContainerSizes: ['40ft'],
        driverName: 'سائق غير معتمد',
        driverPhone: '01077779999',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      setDoc(doc(unapprovedCarrierClient.db, 'offers', `${shipmentId}__${pendingCarrierUid}`), {
        offerId: `${shipmentId}__${pendingCarrierUid}`,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: pendingCarrierUid,
        carrierCompany: 'شركة قيد المراجعة',
        truckId: unapprovedTruckId,
        truckLabel: 'سكانيا (س م أ 7777)',
        priceEgp: 6500,
        estimatedHours: 6,
        notes: 'غير معتمد',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Admin approves main carrier and rejects pending carrier
    await updateDoc(doc(adminClient.db, 'carrierProfiles', carrierUid), {
      verificationStatus: 'approved',
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(adminClient.db, 'carrierProfiles', pendingCarrierUid), {
      verificationStatus: 'rejected',
      updatedAt: serverTimestamp(),
    });

    // Negative: Rejected carrier still CANNOT add trucks or submit offers
    await assert.rejects(() =>
      setDoc(doc(unapprovedCarrierClient.db, 'trucks', unapprovedTruckId), {
        truckId: unapprovedTruckId,
        carrierId: pendingCarrierUid,
        carrierCompany: 'شركة قيد المراجعة',
        plateNumber: 'س م أ 7777',
        tractorModel: 'سكانيا',
        trailerType: 'skeleton_40',
        maxPayloadTons: 40,
        supportedContainerSizes: ['40ft'],
        driverName: 'سائق غير معتمد',
        driverPhone: '01077779999',
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      setDoc(doc(unapprovedCarrierClient.db, 'offers', `${shipmentId}__${pendingCarrierUid}`), {
        offerId: `${shipmentId}__${pendingCarrierUid}`,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: pendingCarrierUid,
        carrierCompany: 'شركة قيد المراجعة',
        truckId: unapprovedTruckId,
        truckLabel: 'سكانيا (س م أ 7777)',
        priceEgp: 6500,
        estimatedHours: 6,
        notes: 'مرفوض',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Positive: Approved carrier can now register their truck
    await setDoc(doc(carrierClient.db, 'trucks', truckId), {
      truckId,
      carrierId: carrierUid,
      carrierCompany: 'شركة الاختبار للنقل',
      plateNumber: 'س م أ 9999',
      tractorModel: 'مرسيدس أكتروس',
      trailerType: 'skeleton_40',
      maxPayloadTons: 40,
      supportedContainerSizes: ['40ft'],
      driverName: 'سائق اختبار',
      driverPhone: '01099998888',
      status: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Cross-tenant PII isolation
    await assert.rejects(() => getDoc(doc(shipperClient.db, 'trucks', truckId)));
    await assert.rejects(() => getDoc(doc(shipperClient.db, 'users', carrierUid)));
  });

  it('03. Prevents duplicate offers, minimum-price bypass, and truck spoofing', async () => {
    const shipperUid = shipperClient.auth.currentUser!.uid;
    const carrierUid = carrierClient.auth.currentUser!.uid;
    const deterministicOfferId = `${shipmentId}__${carrierUid}`;
    const withdrawnOfferId = `${shipmentTamperId}__${carrierUid}`;

    // Negative: Offer below minOrderValueEgp (1500) is rejected
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'offers', deterministicOfferId), {
        offerId: deterministicOfferId,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        truckId,
        truckLabel: 'مرسيدس أكتروس (س م أ 9999)',
        priceEgp: 500,
        estimatedHours: 5,
        notes: 'أقل من الحد الأدنى',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Negative: Carrier cannot spoof a non-owned/non-existent truckId
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'offers', deterministicOfferId), {
        offerId: deterministicOfferId,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        truckId: unapprovedTruckId,
        truckLabel: 'شاحنة مسروقة',
        priceEgp: 7000,
        estimatedHours: 5,
        notes: 'انتحال شاحنة',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Negative: Random non-deterministic offerId is rejected
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'offers', 'off_random_spam_001'), {
        offerId: 'off_random_spam_001',
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        truckId,
        truckLabel: 'مرسيدس أكتروس (س م أ 9999)',
        priceEgp: 7000,
        estimatedHours: 5,
        notes: 'معرف عشوائي',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Negative: Shipper cannot submit an offer
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'offers', `${shipmentId}__${shipperUid}`), {
        offerId: `${shipmentId}__${shipperUid}`,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: shipperUid,
        carrierCompany: 'شركة الاختبار للاستيراد',
        truckId,
        truckLabel: 'وهمية',
        priceEgp: 7000,
        estimatedHours: 5,
        notes: 'انتحال دور',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Positive: Approved carrier submits valid deterministic offer on shipmentId
    await setDoc(doc(carrierClient.db, 'offers', deterministicOfferId), {
      offerId: deterministicOfferId,
      shipmentId,
      shipmentReference: 'MHC-2026-9999',
      shipperId: shipperUid,
      carrierId: carrierUid,
      carrierCompany: 'شركة الاختبار للنقل',
      truckId,
      truckLabel: 'مرسيدس أكتروس (س م أ 9999)',
      priceEgp: 7000,
      estimatedHours: 5,
      notes: 'جاهز للتحميل',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Also create and withdraw an offer on shipmentTamperId for non-pending acceptance tests
    await setDoc(doc(carrierClient.db, 'offers', withdrawnOfferId), {
      offerId: withdrawnOfferId,
      shipmentId: shipmentTamperId,
      shipmentReference: 'MHC-2026-9998',
      shipperId: shipperUid,
      carrierId: carrierUid,
      carrierCompany: 'شركة الاختبار للنقل',
      truckId,
      truckLabel: 'مرسيدس أكتروس (س م أ 9999)',
      priceEgp: 6500,
      estimatedHours: 5,
      notes: 'عرض سيتم سحبه',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(carrierClient.db, 'offers', withdrawnOfferId), {
      status: 'withdrawn',
      updatedAt: serverTimestamp(),
    });

    // Negative: Submitting a second offer on the same shipment (deterministic or random) fails
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'offers', 'off_second_attempt'), {
        offerId: 'off_second_attempt',
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        shipperId: shipperUid,
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        truckId,
        truckLabel: 'مرسيدس أكتروس (س م أ 9999)',
        priceEgp: 6800,
        estimatedHours: 5,
        notes: 'عرض مكرر',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('04. Blocks untrusted commissions creation/tampering and enforces offer/carrier/financial consistency on acceptance', async () => {
    const shipperUid = shipperClient.auth.currentUser!.uid;
    const carrierUid = carrierClient.auth.currentUser!.uid;
    const pendingCarrierUid = unapprovedCarrierClient.auth.currentUser!.uid;
    const offerId = `${shipmentId}__${carrierUid}`;
    const withdrawnOfferId = `${shipmentTamperId}__${carrierUid}`;
    const commissionId = shipmentId;

    const breakdown = calculateCommissionBreakdown(7000, {
      shipperCommissionPercent: 3.5,
      carrierCommissionPercent: 4.5,
    });

    // Negative A: Untrusted client users (shipper or carrier) CANNOT create commissions directly
    await assert.rejects(() =>
      setDoc(doc(shipperClient.db, 'commissions', shipmentTamperId), {
        commissionId: shipmentTamperId,
        shipmentId: shipmentTamperId,
        shipmentReference: 'MHC-2026-9998',
        offerId,
        shipperId: shipperUid,
        shipperCompany: 'شركة الاختبار للاستيراد',
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: 7000,
        shipperRatePercent: 3.5,
        carrierRatePercent: 4.5,
        shipperFeeEgp: 245,
        carrierFeeEgp: 315,
        totalPlatformFeeEgp: 560,
        settlementStatus: 'recorded_pending_gateway',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      setDoc(doc(carrierClient.db, 'commissions', shipmentTamperId), {
        commissionId: shipmentTamperId,
        shipmentId: shipmentTamperId,
        shipmentReference: 'MHC-2026-9998',
        offerId,
        shipperId: shipperUid,
        shipperCompany: 'شركة الاختبار للاستيراد',
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: 7000,
        shipperRatePercent: 3.5,
        carrierRatePercent: 4.5,
        shipperFeeEgp: 245,
        carrierFeeEgp: 315,
        totalPlatformFeeEgp: 560,
        settlementStatus: 'recorded_pending_gateway',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    // Negative B: Shipper CANNOT include commissions creation inside an atomic acceptance batch
    {
      const untrustedCommissionBatch = writeBatch(shipperClient.db);
      untrustedCommissionBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      untrustedCommissionBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperCommissionRate: breakdown.shipperRatePercent,
        carrierCommissionRate: breakdown.carrierRatePercent,
        shipperCommissionEgp: breakdown.shipperFeeEgp,
        carrierCommissionEgp: breakdown.carrierFeeEgp,
        totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      untrustedCommissionBatch.set(doc(shipperClient.db, 'commissions', commissionId), {
        commissionId,
        shipmentId,
        shipmentReference: 'MHC-2026-9999',
        offerId,
        shipperId: shipperUid,
        shipperCompany: 'شركة الاختبار للاستيراد',
        carrierId: carrierUid,
        carrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperRatePercent: breakdown.shipperRatePercent,
        carrierRatePercent: breakdown.carrierRatePercent,
        shipperFeeEgp: breakdown.shipperFeeEgp,
        carrierFeeEgp: breakdown.carrierFeeEgp,
        totalPlatformFeeEgp: breakdown.totalPlatformFeeEgp,
        settlementStatus: 'recorded_pending_gateway',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => untrustedCommissionBatch.commit());
    }

    // Negative C: Shipper cannot mark offer accepted alone without assigning shipment
    await assert.rejects(() =>
      updateDoc(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      })
    );

    // Negative D: Shipper cannot accept an offer that belongs to a DIFFERENT shipment
    {
      const wrongShipmentBatch = writeBatch(shipperClient.db);
      wrongShipmentBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      wrongShipmentBatch.update(doc(shipperClient.db, 'shipments', shipmentTamperId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperCommissionRate: breakdown.shipperRatePercent,
        carrierCommissionRate: breakdown.carrierRatePercent,
        shipperCommissionEgp: breakdown.shipperFeeEgp,
        carrierCommissionEgp: breakdown.carrierFeeEgp,
        totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => wrongShipmentBatch.commit());
    }

    // Negative E: Shipper cannot accept a non-pending (withdrawn) offer
    {
      const withdrawnBreakdown = calculateCommissionBreakdown(6500, {
        shipperCommissionPercent: 3.5,
        carrierCommissionPercent: 4.5,
      });
      const withdrawnBatch = writeBatch(shipperClient.db);
      withdrawnBatch.update(doc(shipperClient.db, 'offers', withdrawnOfferId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      withdrawnBatch.update(doc(shipperClient.db, 'shipments', shipmentTamperId), {
        status: 'assigned',
        acceptedOfferId: withdrawnOfferId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: withdrawnBreakdown.agreedPriceEgp,
        shipperCommissionRate: withdrawnBreakdown.shipperRatePercent,
        carrierCommissionRate: withdrawnBreakdown.carrierRatePercent,
        shipperCommissionEgp: withdrawnBreakdown.shipperFeeEgp,
        carrierCommissionEgp: withdrawnBreakdown.carrierFeeEgp,
        totalShipperPayableEgp: withdrawnBreakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: withdrawnBreakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => withdrawnBatch.commit());
    }

    // Negative F: Shipper cannot accept with mismatched acceptedCarrierId or spoofed acceptedCarrierCompany
    {
      const mismatchCarrierBatch = writeBatch(shipperClient.db);
      mismatchCarrierBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      mismatchCarrierBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: pendingCarrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperCommissionRate: breakdown.shipperRatePercent,
        carrierCommissionRate: breakdown.carrierRatePercent,
        shipperCommissionEgp: breakdown.shipperFeeEgp,
        carrierCommissionEgp: breakdown.carrierFeeEgp,
        totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => mismatchCarrierBatch.commit());
    }
    {
      const spoofCompanyBatch = writeBatch(shipperClient.db);
      spoofCompanyBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      spoofCompanyBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة منتحلة',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperCommissionRate: breakdown.shipperRatePercent,
        carrierCommissionRate: breakdown.carrierRatePercent,
        shipperCommissionEgp: breakdown.shipperFeeEgp,
        carrierCommissionEgp: breakdown.carrierFeeEgp,
        totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => spoofCompanyBatch.commit());
    }

    // Negative G: Shipper cannot accept with tampered agreedPriceEgp or zeroed commission rates/fees
    {
      const tamperedPriceBatch = writeBatch(shipperClient.db);
      tamperedPriceBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      tamperedPriceBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: 100,
        shipperCommissionRate: 0,
        carrierCommissionRate: 0,
        shipperCommissionEgp: 0,
        carrierCommissionEgp: 0,
        totalShipperPayableEgp: 100,
        netCarrierPayoutEgp: 100,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => tamperedPriceBatch.commit());
    }

    // Negative H: Shipper cannot accept an offer if carrier is no longer approved
    await updateDoc(doc(adminClient.db, 'carrierProfiles', carrierUid), {
      verificationStatus: 'pending',
      updatedAt: serverTimestamp(),
    });
    {
      const unapprovedAcceptBatch = writeBatch(shipperClient.db);
      unapprovedAcceptBatch.update(doc(shipperClient.db, 'offers', offerId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      unapprovedAcceptBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'assigned',
        acceptedOfferId: offerId,
        acceptedCarrierId: carrierUid,
        acceptedCarrierCompany: 'شركة الاختبار للنقل',
        agreedPriceEgp: breakdown.agreedPriceEgp,
        shipperCommissionRate: breakdown.shipperRatePercent,
        carrierCommissionRate: breakdown.carrierRatePercent,
        shipperCommissionEgp: breakdown.shipperFeeEgp,
        carrierCommissionEgp: breakdown.carrierFeeEgp,
        totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
        netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
        updatedAt: serverTimestamp(),
      });
      await assert.rejects(() => unapprovedAcceptBatch.commit());
    }
    await updateDoc(doc(adminClient.db, 'carrierProfiles', carrierUid), {
      verificationStatus: 'approved',
      updatedAt: serverTimestamp(),
    });

    // Positive A: Shipper executes valid atomic offer acceptance (offers + shipments)
    const validBatch = writeBatch(shipperClient.db);
    validBatch.update(doc(shipperClient.db, 'offers', offerId), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
    validBatch.update(doc(shipperClient.db, 'shipments', shipmentId), {
      status: 'assigned',
      acceptedOfferId: offerId,
      acceptedCarrierId: carrierUid,
      acceptedCarrierCompany: 'شركة الاختبار للنقل',
      agreedPriceEgp: breakdown.agreedPriceEgp,
      shipperCommissionRate: breakdown.shipperRatePercent,
      carrierCommissionRate: breakdown.carrierRatePercent,
      shipperCommissionEgp: breakdown.shipperFeeEgp,
      carrierCommissionEgp: breakdown.carrierFeeEgp,
      totalShipperPayableEgp: breakdown.totalShipperPayableEgp,
      netCarrierPayoutEgp: breakdown.netCarrierPayoutEgp,
      updatedAt: serverTimestamp(),
    });
    await validBatch.commit();

    // Positive B: Trusted authority (Admin / Backend Cloud Function) creates commission ledger record
    await setDoc(doc(adminClient.db, 'commissions', commissionId), {
      commissionId,
      shipmentId,
      shipmentReference: 'MHC-2026-9999',
      offerId,
      shipperId: shipperUid,
      shipperCompany: 'شركة الاختبار للاستيراد',
      carrierId: carrierUid,
      carrierCompany: 'شركة الاختبار للنقل',
      agreedPriceEgp: breakdown.agreedPriceEgp,
      shipperRatePercent: breakdown.shipperRatePercent,
      carrierRatePercent: breakdown.carrierRatePercent,
      shipperFeeEgp: breakdown.shipperFeeEgp,
      carrierFeeEgp: breakdown.carrierFeeEgp,
      totalPlatformFeeEgp: breakdown.totalPlatformFeeEgp,
      settlementStatus: 'recorded_pending_gateway',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const comSnap = await getDoc(doc(adminClient.db, 'commissions', commissionId));
    assert.equal(comSnap.exists(), true);
    assert.equal(comSnap.data()?.totalPlatformFeeEgp, 560);

    // Negative I: Non-admin users cannot modify or delete commission records
    await assert.rejects(() =>
      updateDoc(doc(shipperClient.db, 'commissions', commissionId), {
        settlementStatus: 'settled',
        totalPlatformFeeEgp: 0,
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() =>
      updateDoc(doc(carrierClient.db, 'commissions', commissionId), {
        carrierFeeEgp: 0,
        updatedAt: serverTimestamp(),
      })
    );
    await assert.rejects(() => deleteDoc(doc(shipperClient.db, 'commissions', commissionId)));
  });

  it('05. Enforces sequential carrier trip stages and terminal state locking', async () => {
    // Negative: Carrier cannot skip assigned -> delivered directly
    await assert.rejects(() =>
      updateDoc(doc(carrierClient.db, 'shipments', shipmentId), {
        status: 'delivered',
        updatedAt: serverTimestamp(),
      })
    );

    // Positive sequential progression: assigned -> in_transit -> at_gate
    await updateDoc(doc(carrierClient.db, 'shipments', shipmentId), {
      status: 'in_transit',
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(carrierClient.db, 'shipments', shipmentId), {
      status: 'at_gate',
      updatedAt: serverTimestamp(),
    });

    // Negative: Carrier cannot revert backward at_gate -> in_transit
    await assert.rejects(() =>
      updateDoc(doc(carrierClient.db, 'shipments', shipmentId), {
        status: 'in_transit',
        updatedAt: serverTimestamp(),
      })
    );

    // Positive completion: at_gate -> delivered -> completed
    await updateDoc(doc(carrierClient.db, 'shipments', shipmentId), {
      status: 'delivered',
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(shipperClient.db, 'shipments', shipmentId), {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    // Negative: Terminal state lock prevents reopening completed shipment
    await assert.rejects(() =>
      updateDoc(doc(shipperClient.db, 'shipments', shipmentId), {
        status: 'open',
        updatedAt: serverTimestamp(),
      })
    );
  });
});
