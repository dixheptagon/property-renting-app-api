export interface GetReviewsByTenantParams {
  page: number;
  limit: number;
  rating?: string | string[];
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: string;
  search?: string;
  propertyId?: string;
}

export interface ReviewStatistics {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsWithStats {
  reviews: any[];
  statistics: ReviewStatistics;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}
