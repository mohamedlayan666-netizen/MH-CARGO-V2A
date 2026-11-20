import type {
  ContainerSize,
  ContainerType,
  OfferStatus,
  PlatformSetting,
  PortId,
  ShipmentStatus,
  TrailerType,
  TransportDirection,
} from '../types/domain';

export interface CommissionBreakdown {
  agreedPriceEgp: number;
  shipperRatePercent: number;
  carrierRatePercent: number;
  shipperFeeEgp: number;
  carrierFeeEgp: number;
  totalPlatformFeeEgp: number;
  totalShipperPayableEgp: number;
  netCarrierPayoutEgp: number;
}

export function calculateCommissionBreakdown(
  agreedPriceEgp: number,
  settings: Pick<PlatformSetting, 'shipperCommissionPercent' | 'carrierCommissionPercent'>
): CommissionBreakdown {
  const safePrice = Math.max(0, Math.round(Number.isFinite(agreedPriceEgp) ? agreedPriceEgp : 0));
  const shipperRatePercent = Math.max(0, Math.min(50, Number(settings.shipperCommissionPercent) || 0));
  const carrierRatePercent = Math.max(0, Math.min(50, Number(settings.carrierCommissionPercent) || 0));

  const shipperFeeEgp = Math.round((safePrice * shipperRatePercent) / 100);
  const carrierFeeEgp = Math.round((safePrice * carrierRatePercent) / 100);
  const totalPlatformFeeEgp = shipperFeeEgp + carrierFeeEgp;
  const totalShipperPayableEgp = safePrice + shipperFeeEgp;
  const netCarrierPayoutEgp = Math.max(0, safePrice - carrierFeeEgp);

  return {
    agreedPriceEgp: safePrice,
    shipperRatePercent,
    carrierRatePercent,
    shipperFeeEgp,
    carrierFeeEgp,
    totalPlatformFeeEgp,
    totalShipperPayableEgp,
    netCarrierPayoutEgp,
  };
}

export function clampNumber(value: number, min: number, max: number, round = false): number {
  const safe = Number.isFinite(value) ? value : min;
  const clamped = Math.max(min, Math.min(max, safe));
  return round ? Math.round(clamped) : clamped;
}

export function sanitizeText(value: string, maxLength: number): string {
  return (value || '').trim().slice(0, maxLength);
}

export interface ShipmentPayloadInput {
  shipmentId: string;
  referenceCode: string;
  shipperId: string;
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

export function buildShipmentPayload(input: ShipmentPayloadInput) {
  return {
    shipmentId: sanitizeText(input.shipmentId, 128),
    referenceCode: sanitizeText(input.referenceCode, 30),
    shipperId: sanitizeText(input.shipperId, 128),
    shipperCompany: sanitizeText(input.shipperCompany, 120),
    port: input.port,
    direction: input.direction,
    terminalGate: sanitizeText(input.terminalGate, 100),
    deliveryLocation: sanitizeText(input.deliveryLocation, 200),
    deliveryGovernorate: sanitizeText(input.deliveryGovernorate, 80),
    containerSize: input.containerSize,
    containerType: input.containerType,
    containerCount: clampNumber(input.containerCount, 1, 50, true),
    cargoWeightTons: clampNumber(input.cargoWeightTons, 1, 200, false),
    cargoDescription: sanitizeText(input.cargoDescription, 500),
    instructions: sanitizeText(input.instructions, 1000),
    pickupDate: sanitizeText(input.pickupDate, 30),
    targetBudgetEgp: clampNumber(input.targetBudgetEgp, 0, 10000000, false),
    status: 'open' as const,
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
  };
}

export function buildOfferPayload(input: {
  offerId: string;
  shipmentId: string;
  shipmentReference: string;
  shipperId: string;
  carrierId: string;
  carrierCompany: string;
  truckId: string;
  truckLabel: string;
  priceEgp: number;
  estimatedHours: number;
  notes: string;
}) {
  return {
    offerId: sanitizeText(input.offerId, 128),
    shipmentId: sanitizeText(input.shipmentId, 128),
    shipmentReference: sanitizeText(input.shipmentReference, 40),
    shipperId: sanitizeText(input.shipperId, 128),
    carrierId: sanitizeText(input.carrierId, 128),
    carrierCompany: sanitizeText(input.carrierCompany, 120),
    truckId: sanitizeText(input.truckId, 128),
    truckLabel: sanitizeText(input.truckLabel, 120),
    priceEgp: clampNumber(input.priceEgp, 100, 10000000, true),
    estimatedHours: clampNumber(input.estimatedHours, 1, 720, true),
    notes: sanitizeText(input.notes, 600),
    status: 'pending' as const,
  };
}

export function buildTruckPayload(input: {
  truckId: string;
  carrierId: string;
  carrierCompany: string;
  plateNumber: string;
  tractorModel: string;
  trailerType: TrailerType;
  maxPayloadTons: number;
  supportedContainerSizes: ContainerSize[];
  driverName: string;
  driverPhone: string;
}) {
  const sizes: ContainerSize[] =
    input.supportedContainerSizes.length > 0 ? input.supportedContainerSizes.slice(0, 3) : ['40ft'];
  return {
    truckId: sanitizeText(input.truckId, 128),
    carrierId: sanitizeText(input.carrierId, 128),
    carrierCompany: sanitizeText(input.carrierCompany, 120),
    plateNumber: sanitizeText(input.plateNumber, 30),
    tractorModel: sanitizeText(input.tractorModel, 80),
    trailerType: input.trailerType,
    maxPayloadTons: clampNumber(input.maxPayloadTons, 1, 100, false),
    supportedContainerSizes: sizes,
    driverName: sanitizeText(input.driverName, 80),
    driverPhone: sanitizeText(input.driverPhone, 30),
    status: 'available' as const,
  };
}

export function isValidShipmentTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
  actorRole: 'shipper' | 'carrier' | 'admin'
): boolean {
  if (actorRole === 'admin') return true;
  if (from === 'completed' || from === 'cancelled') return false;

  if (actorRole === 'shipper') {
    if (from === 'open' && (to === 'open' || to === 'cancelled' || to === 'assigned')) return true;
    if (from === 'delivered' && to === 'completed') return true;
    return false;
  }

  if (actorRole === 'carrier') {
    if (from === 'assigned' && to === 'in_transit') return true;
    if (from === 'in_transit' && (to === 'at_gate' || to === 'delivered')) return true;
    if (from === 'at_gate' && to === 'delivered') return true;
    return false;
  }

  return false;
}

export function isValidOfferTransition(
  from: OfferStatus,
  to: OfferStatus,
  actorRole: 'shipper' | 'carrier' | 'admin'
): boolean {
  if (actorRole === 'admin') return true;
  if (from !== 'pending') return false;
  if (actorRole === 'shipper') return to === 'accepted' || to === 'rejected';
  if (actorRole === 'carrier') return to === 'withdrawn';
  return false;
}
