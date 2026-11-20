import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { terminate } from 'firebase/firestore';
import {
  buildOfferPayload,
  buildShipmentPayload,
  buildTruckPayload,
  calculateCommissionBreakdown,
  isValidOfferTransition,
  isValidShipmentTransition,
} from '../src/lib/domainLogic';
import { db, handleFirestoreError, OperationType } from '../src/lib/firebase';

const blueprint = JSON.parse(fs.readFileSync('./firebase-blueprint.json', 'utf8'));

describe('MH CARGO Domain Logic & Blueprint Boundary Tests', () => {
  after(async () => {
    await terminate(db).catch(() => {});
  });

  it('calculates dual-sided commissions accurately for Shipper and Carrier', () => {
    const res = calculateCommissionBreakdown(10000, {
      shipperCommissionPercent: 3.5,
      carrierCommissionPercent: 4.5,
    });

    assert.equal(res.agreedPriceEgp, 10000);
    assert.equal(res.shipperFeeEgp, 350);
    assert.equal(res.carrierFeeEgp, 450);
    assert.equal(res.totalPlatformFeeEgp, 800);
    assert.equal(res.totalShipperPayableEgp, 10350);
    assert.equal(res.netCarrierPayoutEgp, 9550);
  });

  it('handles 0% commission rates and NaN/negative inputs safely without NaN leakage', () => {
    const res = calculateCommissionBreakdown(Number.NaN, {
      shipperCommissionPercent: 0,
      carrierCommissionPercent: 0,
    });

    assert.equal(res.agreedPriceEgp, 0);
    assert.equal(res.shipperFeeEgp, 0);
    assert.equal(res.carrierFeeEgp, 0);
    assert.equal(res.totalPlatformFeeEgp, 0);
    assert.equal(Number.isFinite(res.netCarrierPayoutEgp), true);
  });

  it('enforces firebase-blueprint.json maxLength and numeric constraints on Shipment payload', () => {
    const maxDescLen = blueprint.entities.Shipment.properties.cargoDescription.maxLength;
    const maxInstLen = blueprint.entities.Shipment.properties.instructions.maxLength;

    const payload = buildShipmentPayload({
      shipmentId: 'shp_test_001',
      referenceCode: 'MHC-2026-1001',
      shipperId: 'test_shipper_uid',
      shipperCompany: 'شركة اختبار التجارة',
      port: 'alexandria',
      direction: 'from_port',
      terminalGate: 'باب 27',
      deliveryLocation: 'برج العرب الصناعية',
      deliveryGovernorate: 'الإسكندرية',
      containerSize: '40ft',
      containerType: 'dry',
      containerCount: Number.NaN,
      cargoWeightTons: 999, // exceeds 200 max
      cargoDescription: 'ب'.repeat(800),
      instructions: 'ت'.repeat(1500),
      pickupDate: '2026-12-01',
      targetBudgetEgp: -500,
    });

    assert.equal(payload.status, 'open');
    assert.equal(payload.containerCount, 1);
    assert.equal(payload.cargoWeightTons, 200);
    assert.equal(payload.targetBudgetEgp, 0);
    assert.equal(payload.cargoDescription.length, maxDescLen);
    assert.equal(payload.instructions.length, maxInstLen);

    for (const reqKey of blueprint.entities.Shipment.required) {
      if (reqKey !== 'createdAt' && reqKey !== 'updatedAt') {
        assert.ok(reqKey in payload, `Missing required Shipment field: ${reqKey}`);
      }
    }
  });

  it('enforces firebase-blueprint.json constraints on Offer and Truck payloads', () => {
    const offer = buildOfferPayload({
      offerId: 'off_test_001',
      shipmentId: 'shp_test_001',
      shipmentReference: 'MHC-2026-1001',
      shipperId: 'test_shipper_uid',
      carrierId: 'test_carrier_uid',
      carrierCompany: 'شركة نقل تجريبية',
      truckId: 'trk_test_001',
      truckLabel: 'فولفو FH (س م أ 1234)',
      priceEgp: 50, // below min 100
      estimatedHours: 900, // above max 720
      notes: 'م'.repeat(900),
    });

    assert.equal(offer.priceEgp, 100);
    assert.equal(offer.estimatedHours, 720);
    assert.equal(offer.notes.length, blueprint.entities.Offer.properties.notes.maxLength);
    assert.equal(offer.status, 'pending');

    const truck = buildTruckPayload({
      truckId: 'trk_test_001',
      carrierId: 'test_carrier_uid',
      carrierCompany: 'شركة نقل تجريبية',
      plateNumber: 'س م أ 1234',
      tractorModel: 'مرسيدس أكتروس',
      trailerType: 'skeleton_40',
      maxPayloadTons: 500, // exceeds 100 max
      supportedContainerSizes: [],
      driverName: 'سائق تجريبي',
      driverPhone: '01000000000',
    });

    assert.equal(truck.maxPayloadTons, 100);
    assert.deepEqual(truck.supportedContainerSizes, ['40ft']);
    assert.equal(truck.status, 'available');
  });

  it('enforces valid shipment and offer state transitions and terminal locking', () => {
    assert.equal(isValidShipmentTransition('open', 'assigned', 'shipper'), true);
    assert.equal(isValidShipmentTransition('assigned', 'in_transit', 'carrier'), true);
    assert.equal(isValidShipmentTransition('in_transit', 'at_gate', 'carrier'), true);
    assert.equal(isValidShipmentTransition('at_gate', 'delivered', 'carrier'), true);
    assert.equal(isValidShipmentTransition('delivered', 'completed', 'shipper'), true);

    // Invalid shortcutting or role violation
    assert.equal(isValidShipmentTransition('open', 'delivered', 'carrier'), false);
    assert.equal(isValidShipmentTransition('assigned', 'completed', 'carrier'), false);

    // Terminal states cannot be reopened by shipper or carrier
    assert.equal(isValidShipmentTransition('completed', 'open', 'shipper'), false);
    assert.equal(isValidShipmentTransition('cancelled', 'open', 'shipper'), false);

    // Offer state transitions
    assert.equal(isValidOfferTransition('pending', 'accepted', 'shipper'), true);
    assert.equal(isValidOfferTransition('pending', 'rejected', 'shipper'), true);
    assert.equal(isValidOfferTransition('pending', 'withdrawn', 'carrier'), true);
    assert.equal(isValidOfferTransition('pending', 'accepted', 'carrier'), false);
    assert.equal(isValidOfferTransition('accepted', 'rejected', 'shipper'), false);
  });

  it('formats structured FirestoreErrorInfo payloads via handleFirestoreError', () => {
    assert.throws(
      () => handleFirestoreError(new Error('PERMISSION_DENIED: test probe'), OperationType.WRITE, 'shipments/shp_test_001'),
      (err: Error) => {
        const parsed = JSON.parse(err.message);
        return (
          parsed.operationType === 'write' &&
          parsed.path === 'shipments/shp_test_001' &&
          parsed.error.includes('PERMISSION_DENIED')
        );
      }
    );
  });
});
