export interface Court {
  id: string;
  name: string;
  surface: string;
  isActive: boolean;
}

export interface PricingRule {
  id: string;
  daysOfWeek: number[]; // 1=Thứ 2 ... 7=CN
  startMin: number;     // phút từ 00:00
  endMin: number;
  walkInPrice: number;  // VND / giờ
  fixedPrice: number;   // VND / giờ
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;       // 1..5
  comment: string;
  createdAt: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  openMin: number;      // 300 = 05:00
  closeMin: number;     // 1320 = 22:00
  priceFrom: number;    // VND / giờ nhỏ nhất
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  amenities: string[];  // AC, PARKING, RACKET_RENTAL, CANTEEN, SHOWER, WIFI
  cancelBeforeHours: number;
  paymentMode: "ONLINE_ONLY" | "ONLINE_FULL" | "AT_VENUE";
  hasSlotTonight: boolean;
  distanceKm?: number;
  courts: Court[];
  pricingRules: PricingRule[];
  reviews: Review[];
}

export interface VenueFilterParams {
  q?: string;
  district?: string;
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  hasSlotTonight?: boolean;
  isOpenNow?: boolean;
  sort?: "distance" | "rating" | "price_asc" | "price_desc";
  date?: string;
  fromMin?: number;
}

export interface VenueSearchSuggestion {
  id: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  priceFrom: number;
  ratingAvg: number;
  images: string[];
}
