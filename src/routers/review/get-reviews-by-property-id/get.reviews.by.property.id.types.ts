export interface GetReviewsByPropertyIdParams {
  page: number;
  limit: number;
  rating?: string | string[];
  sort_by?: string;
  sort_dir?: string;
  search?: string;
}

export interface ReviewData {
  username: string;
  roomTypeName: string;
  reviewComment: string;
  createdAt: Date;
  rating: number;
  tenantName: string;
  tenantReply?: string;
  updatedAt: Date;
}

export interface ReviewsByPropertyIdResult {
  reviews: ReviewData[];
  statistics: {
    totalReviews: number;
    averageRating: number;
    ratingStatistics: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
