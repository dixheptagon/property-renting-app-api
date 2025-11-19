interface GetPropertyListParams {
  tenantId: number;
  status?: string;
  category?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: string;
}

interface PropertyListResponse {
  data: {
    uid: string;
    category: string;
    status: string;
    title: string;
    location: {
      address: string;
      city: string;
      country: string;
      latitude: any;
      longitude: any;
    };
    review_summary: {
      average_rating: number | null;
      review_count: number;
    };
    main_image: string | null;
    created_at: Date;
    updated_at: Date | null;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export { GetPropertyListParams, PropertyListResponse };
