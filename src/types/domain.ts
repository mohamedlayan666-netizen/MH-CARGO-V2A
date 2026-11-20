import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'shipper' | 'carrier';
export type AccountStatus = 'active' | 'pending_review' | 'suspended';
export type PortId = 'alexandria' | 'dekheila';
export type TransportDirection = 'from_port' | 'to_port';
export type ContainerSize = '20ft' | '40ft' | '40ft_hc';
export type ContainerType = 'dry' | 'reefer' | 'open_top' | 'flat_rack' | 'tank';
export type TrailerType = 'flatbed_20' | 'flatbed_40' | 'skeleton_40' | 'reefer_chassis' | 'lowbed';
export type TruckStatus = 'available' | 'on_trip' | 'maintenance';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ShipmentStatus =
  | 'open'
  | 'assigned'
  | 'in_transit'
  | 'at_gate'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type SettlementStatus = 'recorded_pending_gateway' | 'settled' | 'cancelled';
export type ComplaintStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  companyName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  commercialRegister?: string;
  city?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CarrierProfile {
  carrierId: string;
  companyName: string;
  ownerName: string;
  city: string;
  servicePorts: PortId[];
  yearsExperience: number;
  description: string;
  verificationStatus: VerificationStatus;
  truckCount: number;
  completedTrips: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Truck {
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
  status: TruckStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Shipment {
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
  status: ShipmentStatus;
  acceptedOfferId: string;
  acceptedCarrierId: string;
  acceptedCarrierCompany: string;
  agreedPriceEgp: number;
  shipperCommissionRate: number;
  carrierCommissionRate: number;
  shipperCommissionEgp: number;
  carrierCommissionEgp: number;
  totalShipperPayableEgp: number;
  netCarrierPayoutEgp: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Offer {
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
  status: OfferStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommissionLedger {
  commissionId: string;
  shipmentId: string;
  shipmentReference: string;
  offerId: string;
  shipperId: string;
  shipperCompany: string;
  carrierId: string;
  carrierCompany: string;
  agreedPriceEgp: number;
  shipperRatePercent: number;
  carrierRatePercent: number;
  shipperFeeEgp: number;
  carrierFeeEgp: number;
  totalPlatformFeeEgp: number;
  settlementStatus: SettlementStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PlatformSetting {
  settingId: string;
  shipperCommissionPercent: number;
  carrierCommissionPercent: number;
  minOrderValueEgp: number;
  paymentCollectionMode: 'manual_recording_no_gateway';
  updatedBy: string;
  updatedAt?: Timestamp;
}

export interface Complaint {
  complaintId: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  shipmentId: string;
  subject: string;
  details: string;
  status: ComplaintStatus;
  adminNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ContactMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed';
  createdAt?: Timestamp;
}
