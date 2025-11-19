import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import {
  GetReviewsByTenantParams,
  ReviewStatistics,
  ReviewsWithStats,
} from './get.reviews.by.tenant.types';

export const getReviewsByTenant = async (
  userId: number,
  params: GetReviewsByTenantParams,
): Promise<ReviewsWithStats> => {
  const {
    page,
    limit,
    rating,
    date_from,
    date_to,
    sort_by,
    sort_dir,
    search,
    propertyId,
  } = params;

  // Determine property ID for tenant

  let propertyIdNum: number;
  if (!propertyId) {
    // Get first property of user
    const property = await database.property.findFirst({
      where: { user_id: userId },
      select: { id: true, uid: true, rooms: { select: { name: true } } },
    });

    if (!property) {
      console.error('❌ [Get Reviews by Tenant] No properties found for user');
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Tenant does not have any property',
      );
    }

    propertyIdNum = property.id;
  } else {
    // Find property by uid and verify ownership
    const property = await database.property.findUnique({
      where: { uid: propertyId },
      select: { id: true, user_id: true },
    });

    if (!property) {
      console.error(
        '❌ [Get Reviews by Tenant] Property not found:',
        propertyId,
      );
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property not found',
      );
    }

    // Verify the property belongs to the authenticated tenant
    if (property.user_id !== userId) {
      console.error(
        '🚫 [Get Reviews by Tenant] Property ownership verification failed',
      );
      console.error(
        '   Property user_id:',
        property.user_id,
        'Request user_id:',
        userId,
      );
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'You can only view reviews for your own properties',
      );
    }

    propertyIdNum = property.id;
  }

  // Build where clause

  const where: any = {
    property_id: propertyIdNum,
  };

  // Rating filter
  if (rating) {
    const ratingArray = Array.isArray(rating)
      ? rating.map((r) => parseInt(r as string, 10)).filter((r) => !isNaN(r))
      : typeof rating === 'string'
        ? rating
            .split(',')
            .map((r) => parseInt(r.trim(), 10))
            .filter((r) => !isNaN(r))
        : [];

    if (ratingArray.length > 0) {
      where.rating = {
        in: ratingArray,
      };
    }
  }

  // Date range filter
  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) {
      where.created_at.gte = new Date(date_from);
    }
    if (date_to) {
      where.created_at.lte = new Date(date_to);
    }
  }

  // Search filter (in user names or room type names)
  if (search && typeof search === 'string') {
    where.OR = [
      {
        user: {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { display_name: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
      {
        booking: {
          room: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  // Build order clause

  const orderBy: any = {};
  if (sort_by) {
    orderBy[sort_by] = sort_dir || 'desc';
  } else {
    orderBy.created_at = 'desc';
  }

  // Get reviews with pagination

  const reviews = await database.review.findMany({
    where,
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          display_name: true,
        },
      },
      booking: {
        select: {
          uid: true,
          check_in_date: true,
          check_out_date: true,
          room: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  // Debug: Check if there are any reviews at all for this property
  const allReviewsForProperty = await database.review.count({
    where: { property_id: propertyIdNum },
  });

  // Debug: Check raw reviews without filters
  if (reviews.length === 0 && allReviewsForProperty > 0) {
    const rawReviews = await database.review.findMany({
      where: { property_id: propertyIdNum },
      take: 3,
      select: {
        id: true,
        rating: true,
        created_at: true,
        user_id: true,
        booking_id: true,
      },
    });
  }

  // Get total count

  const totalCount = await database.review.count({ where });
  const totalPages = Math.ceil(totalCount / limit);

  // Calculate rating statistics

  const allFilteredReviews = await database.review.findMany({
    where,
    select: {
      rating: true,
    },
  });

  // Calculate average rating
  const averageRating =
    allFilteredReviews.length > 0
      ? allFilteredReviews.reduce(
          (sum, review) => sum + Number(review.rating),
          0,
        ) / allFilteredReviews.length
      : 0;

  // Calculate rating distribution (1-5 stars)
  const ratingStats = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  allFilteredReviews.forEach((review) => {
    const rating = Math.floor(
      Number(review.rating),
    ) as keyof typeof ratingStats;
    if (rating >= 1 && rating <= 5) {
      ratingStats[rating]++;
    }
  });

  const statistics: ReviewStatistics = {
    average_rating: Number(averageRating.toFixed(1)),
    total_reviews: allFilteredReviews.length,
    rating_distribution: ratingStats,
  };

  const result = {
    reviews,
    statistics,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  };

  return result;
};
