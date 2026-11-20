import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  setDoc,
  terminate,
} from 'firebase/firestore';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg, 'readonly-verification-app');
const db = getFirestore(app, cfg.firestoreDatabaseId);

// Separate invalid-config instance to verify network/connection failure handling
const badApp = initializeApp(
  {
    ...cfg,
    projectId: 'nonexistent-mh-cargo-test-000',
    apiKey: 'invalid-key',
  },
  'offline-failure-probe'
);
const badDb = getFirestore(badApp, 'nonexistent-db');

describe('Live Firestore Connection & Security Enforcement (Read-Only / Zero Production Writes)', () => {
  after(async () => {
    await terminate(db).catch(() => {});
    await terminate(badDb).catch(() => {});
    await deleteApp(app).catch(() => {});
    await deleteApp(badApp).catch(() => {});
  });

  it('connects to live Firestore server via getDocFromServer(test/connection)', async () => {
    const snap = await getDocFromServer(doc(db, 'test', 'connection'));
    assert.equal(typeof snap.exists(), 'boolean');
  });

  it('allows reading public platformSettings/commissions without PII exposure', async () => {
    const snap = await getDocFromServer(doc(db, 'platformSettings', 'commissions'));
    assert.equal(typeof snap.exists(), 'boolean');
  });

  it('blocks unauthenticated list queries across all protected collections', async () => {
    const protectedCollections = [
      'users',
      'admins',
      'carrierProfiles',
      'trucks',
      'shipments',
      'offers',
      'commissions',
      'complaints',
      'contactMessages',
    ];

    for (const colName of protectedCollections) {
      await assert.rejects(
        () => getDocs(collection(db, colName)),
        (err: { code?: string }) => err?.code === 'permission-denied',
        `Expected permission-denied for unauthenticated list on ${colName}`
      );
    }
  });

  it('blocks unauthenticated writes to users, admins, shipments, offers, and platformSettings', async () => {
    await assert.rejects(
      () => setDoc(doc(db, 'users', 'probe_unauth_user'), { uid: 'probe_unauth_user', role: 'shipper' }),
      (err: { code?: string }) => err?.code === 'permission-denied'
    );

    await assert.rejects(
      () => setDoc(doc(db, 'admins', 'probe_unauth_admin'), { uid: 'probe_unauth_admin' }),
      (err: { code?: string }) => err?.code === 'permission-denied'
    );

    await assert.rejects(
      () => setDoc(doc(db, 'shipments', 'probe_unauth_shp'), { shipmentId: 'probe_unauth_shp' }),
      (err: { code?: string }) => err?.code === 'permission-denied'
    );

    await assert.rejects(
      () => setDoc(doc(db, 'offers', 'probe_unauth_off'), { offerId: 'probe_unauth_off' }),
      (err: { code?: string }) => err?.code === 'permission-denied'
    );

    await assert.rejects(
      () => setDoc(doc(db, 'platformSettings', 'commissions'), { shipperCommissionPercent: 0 }),
      (err: { code?: string }) => err?.code === 'permission-denied'
    );
  });

  it('surfaces a structured failure when connecting to an unreachable/invalid Firestore target', async () => {
    await assert.rejects(
      () => getDocFromServer(doc(badDb, 'test', 'connection')),
      (err: Error & { code?: string }) => Boolean(err && (err.code || err.message))
    );
  });
});
