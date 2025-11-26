import { Decimal } from '@prisma/client/runtime/library';

export type PropertyDetailResponse = {
  uid: string;
  category: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  latitude: Decimal | null;
  longitude: Decimal | null;
  place_id: string | null;
  map_url: string | null;
  amenities: any;
  custom_amenities: any;
  rules: any;
  custom_rules: any;
  rating_avg: Decimal | null;
  rating_count: number | null;
  base_price: Decimal;
  status: string;
  tenant: {
    id: number;
    name: string;
    display_name: string | null;
    profile_picture_url: string;
  };
  images: Array<{
    id: number;
    url: string;
    is_main: boolean;
    order_index: number;
  }>;
  rooms: Array<{
    id: number;
    uid: string;
    name: string;
    description: string;
    base_price: Decimal;
    max_guest: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
    highlight: any;
    custom_highlight: any;
    total_units: number;
    images: Array<{
      url: string;
      is_main: boolean;
      order_index: number;
    }>;
  }>;
  room_unavailabilities: Array<{
    id: number;
    room_id: number;
    start_date: Date;
    end_date: Date;
    reason: string | null;
  }>;
  peak_season_rates: Array<{
    id: number;
    room_id: number | null;
    start_date: Date;
    end_date: Date;
    adjustment_type: string;
    adjustment_value: Decimal;
  }>;
};
