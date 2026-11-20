import type {
  AccountStatus,
  ComplaintStatus,
  ContainerSize,
  ContainerType,
  OfferStatus,
  PortId,
  SettlementStatus,
  ShipmentStatus,
  TrailerType,
  TransportDirection,
  TruckStatus,
  VerificationStatus,
} from '../types/domain';

export const ASSET_IMAGES = {
  heroPort: '/src/assets/images/hero_container_port_1795013739077.jpg',
  alexandriaPort: '/src/assets/images/alexandria_port_terminal_1795013740135.jpg',
  dekheilaPort: '/src/assets/images/dekheila_port_logistics_1795013741729.jpg',
  fleetTruck: '/src/assets/images/container_fleet_trucks_1795013739977.jpg',
} as const;

export const DEFAULT_COMMISSION_SETTINGS = {
  settingId: 'commissions',
  shipperCommissionPercent: 3.5,
  carrierCommissionPercent: 4.5,
  minOrderValueEgp: 1500,
  paymentCollectionMode: 'manual_recording_no_gateway' as const,
};

export const PORT_LABELS: Record<PortId, string> = {
  alexandria: 'ميناء الإسكندرية',
  dekheila: 'ميناء الدخيلة',
};

export const PORT_GATES: Record<PortId, string[]> = {
  alexandria: [
    'باب 27 - محطة حاويات الإسكندرية (AICT)',
    'باب 54 - المنطقة الجمركية واللوجستية',
    'باب 14 - البضائع والحاويات العامة',
    'محطة تحيا مصر متعددة الأغراض (TMT)',
  ],
  dekheila: [
    'البوابة الرئيسية - محطة حاويات الدخيلة (DICTS)',
    'بوابة الصادر والوارد - رصيف 96',
    'بوابة الفحص الجمركي والموازين',
    'ساحة الإيداع الجمركي - الدخيلة',
  ],
};

export const DIRECTION_LABELS: Record<TransportDirection, string> = {
  from_port: 'من الميناء إلى المخزن / موقع العميل',
  to_port: 'من المخزن / المصنع إلى الميناء (صادر)',
};

export const CONTAINER_SIZE_LABELS: Record<ContainerSize, string> = {
  '20ft': '20 قدم قياسية',
  '40ft': '40 قدم قياسية',
  '40ft_hc': '40 قدم مرتفعة (High Cube)',
};

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  dry: 'جافة (Dry Van)',
  reefer: 'مبردة (Reefer)',
  open_top: 'مكشوفة السقف (Open Top)',
  flat_rack: 'مسطحة (Flat Rack)',
  tank: 'صهريج سوائل (ISO Tank)',
};

export const TRAILER_TYPE_LABELS: Record<TrailerType, string> = {
  flatbed_20: 'سطحة حاويات 20 قدم',
  flatbed_40: 'سطحة حاويات 40 قدم',
  skeleton_40: 'شاسيه هيكلية للحاويات 40/20 قدم',
  reefer_chassis: 'شاسيه مجهزة بمولد تبريد (Reefer)',
  lowbed: 'لوابد لنقل الحاويات والمعدات الثقيلة',
};

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  available: 'متاح للتشغيل',
  on_trip: 'في مهمة نقل',
  maintenance: 'في الصيانة',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  open: 'مفتوح لتلقي العروض',
  assigned: 'تم الترسية والتعيين',
  in_transit: 'في الطريق',
  at_gate: 'على بوابة الميناء / التحميل',
  delivered: 'تم التسليم بالموقع',
  completed: 'مكتمل ومغلق',
  cancelled: 'ملغي',
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'قيد المراجعة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  withdrawn: 'مسحوب',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'نشط',
  pending_review: 'قيد المراجعة',
  suspended: 'معلق إدارياً',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد وموثق',
  rejected: 'مرفوض',
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  recorded_pending_gateway: 'مسجل (بدون تحصيل إلكتروني)',
  settled: 'تمت التسوية',
  cancelled: 'ملغي',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'جديدة',
  under_review: 'قيد التحقيق',
  resolved: 'تم الحل',
  dismissed: 'مغلقة',
};

export const EGYPT_GOVERNORATES = [
  'الإسكندرية',
  'البحيرة',
  'القاهرة',
  'الجيزة',
  'القليوبية (العبور / شبرا)',
  'الشرقية (العاشر من رمضان)',
  'المنوفية (مدينة السادات)',
  'الغربية',
  'الدقهلية',
  'دمياط',
  'كفر الشيخ',
  'بورسعيد',
  'السويس',
  'الإسماعيلية',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
];

export function formatEgp(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} ج.م`;
}

export function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
}

export function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MHC-${year}-${num}`;
}
