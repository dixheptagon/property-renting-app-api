interface UploadPropertyPayload {
  property: {
    title: string;
    category: string;
    description: string;
    base_price: number;
    address: string;
    city: string;
    country: string;
    postal_code: string;
    latitude?: number | null;
    longitude?: number | null;
    place_id?: string | null;
    map_url?: string | null;
    amenities?: string[] | null;
    custom_amenities?: string[] | null;
    rules?: string[] | null;
    custom_rules?: string[] | null;
  };
  propertyImages: Array<{
    id: number;
    publicId: string;
    secureUrl: string;
    isMain: boolean;
    orderIndex: number;
    status: string;
    tempGroupId: string;
  }>;
  rooms: Array<{
    tempId: string;
    name: string;
    description: string;
    base_price: number;
    max_guest: number;
    total_units: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
    highlight?: string[] | null;
    custom_highlight?: string[] | null;
    images: Array<{
      id: number;
      publicId: string;
      secureUrl: string;
      isMain: boolean;
      orderIndex: number;
      status: string;
      tempGroupId: string;
    }>;
  }>;
  peakSeasonRates: Array<{
    tempId: string;
    targetTempRoomId: string;
    start_date: string;
    end_date: string;
    adjustment_type: string;
    adjustment_value: number;
  }>;
  unavailabilities: Array<{
    tempId: string;
    targetTempRoomId: string;
    start_date: string;
    end_date: string;
    reason?: string | null;
  }>;
}

export { UploadPropertyPayload };
