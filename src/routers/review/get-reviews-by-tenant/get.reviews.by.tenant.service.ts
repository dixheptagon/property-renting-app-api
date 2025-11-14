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
  console.log(
    '🔍 [Get Reviews by Tenant] Starting process for userId:',
    userId,
  );
  console.log('📋 [Get Reviews by Tenant] Parameters:', params);

  const {
    page,
    limit,
    rating = 5,
    date_from,
    date_to,
    sort_by,
    sort_dir,
    search,
    propertyId,
  } = params;

  // Determine property ID for tenant
  console.log('🏠 [Get Reviews by Tenant] Determining property ID...');
  let propertyIdNum: number;
  if (!propertyId) {
    console.log(
      '📋 [Get Reviews by Tenant] No propertyId specified, getting first property for user',
    );
    // Get first property of user
    const property = await database.property.findFirst({
      where: { user_id: userId },
      select: { id: true, uid: true, rooms: { select: { name: true } } },
    });

    console.log('🏠 [Get Reviews by Tenant] First property result:', property);

    if (!property) {
      console.error('❌ [Get Reviews by Tenant] No properties found for user');
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Tenant does not have any property',
      );
    }

    propertyIdNum = property.id;
    console.log(
      '✅ [Get Reviews by Tenant] Using first property with ID:',
      propertyIdNum,
    );
  } else {
    console.log('📋 [Get Reviews by Tenant] PropertyId specified:', propertyId);
    // Find property by uid and verify ownership
    const property = await database.property.findUnique({
      where: { uid: propertyId },
      select: { id: true, user_id: true },
    });

    console.log('🏠 [Get Reviews by Tenant] Property lookup result:', property);

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
    console.log(
      '✅ [Get Reviews by Tenant] Property ownership verified, using property ID:',
      propertyIdNum,
    );
  }

  // Build where clause
  console.log('🔧 [Get Reviews by Tenant] Building query filters...');
  const where: any = {
    property_id: propertyIdNum,
  };
  console.log('📊 [Get Reviews by Tenant] Base where clause:', where);

  // Rating filter
  if (rating) {
    console.log('⭐ [Get Reviews by Tenant] Applying rating filter:', rating);
    const ratingArray = Array.isArray(rating)
      ? rating.map((r) => parseInt(r as string, 10)).filter((r) => !isNaN(r))
      : typeof rating === 'string'
        ? rating
            .split(',')
            .map((r) => parseInt(r.trim(), 10))
            .filter((r) => !isNaN(r))
        : [];

    console.log('⭐ [Get Reviews by Tenant] Parsed rating array:', ratingArray);

    if (ratingArray.length > 0) {
      where.rating = {
        in: ratingArray,
      };
      console.log(
        '✅ [Get Reviews by Tenant] Rating filter applied:',
        where.rating,
      );
    }
  }

  // Date range filter
  if (date_from || date_to) {
    console.log('📅 [Get Reviews by Tenant] Applying date range filter:', {
      date_from,
      date_to,
    });
    where.created_at = {};
    if (date_from) {
      where.created_at.gte = new Date(date_from);
      console.log(
        '📅 [Get Reviews by Tenant] Date from applied:',
        where.created_at.gte,
      );
    }
    if (date_to) {
      where.created_at.lte = new Date(date_to);
      console.log(
        '📅 [Get Reviews by Tenant] Date to applied:',
        where.created_at.lte,
      );
    }
  }

  // Search filter (in user names or room type names)
  if (search && typeof search === 'string') {
    console.log('🔍 [Get Reviews by Tenant] Applying search filter:', search);
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
    console.log('✅ [Get Reviews by Tenant] Search filter applied');
  }

  console.log(
    '🎯 [Get Reviews by Tenant] Final where clause:',
    JSON.stringify(where, null, 2),
  );

  // Build order clause
  console.log('🔀 [Get Reviews by Tenant] Building sort order...');
  const orderBy: any = {};
  if (sort_by) {
    orderBy[sort_by] = sort_dir || 'desc';
  } else {
    orderBy.created_at = 'desc';
  }
  console.log('🔀 [Get Reviews by Tenant] Order clause:', orderBy);

  // Get reviews with pagination
  console.log('🗄️ [Get Reviews by Tenant] Executing database query...');
  console.log(
    '📄 [Get Reviews by Tenant] Pagination - Page:',
    page,
    'Limit:',
    limit,
    'Skip:',
    (page - 1) * limit,
  );

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

  console.log(
    '📊 [Get Reviews by Tenant] Reviews query completed. Found',
    reviews.length,
    'reviews',
  );

  // Get total count
  console.log('🔢 [Get Reviews by Tenant] Getting total count...');
  const totalCount = await database.review.count({ where });
  const totalPages = Math.ceil(totalCount / limit);

  console.log(
    '📈 [Get Reviews by Tenant] Total count:',
    totalCount,
    'Total pages:',
    totalPages,
  );

  // Calculate rating statistics
  console.log('📊 [Get Reviews by Tenant] Calculating rating statistics...');

  const allFilteredReviews = await database.review.findMany({
    where,
    select: {
      rating: true,
    },
  });

  console.log(
    '📊 [Get Reviews by Tenant] Found',
    allFilteredReviews.length,
    'reviews for statistics',
  );

  // Calculate average rating
  const averageRating =
    allFilteredReviews.length > 0
      ? allFilteredReviews.reduce(
          (sum, review) => sum + Number(review.rating),
          0,
        ) / allFilteredReviews.length
      : 0;

  console.log(
    '📊 [Get Reviews by Tenant] Average rating calculated:',
    averageRating,
  );

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

  console.log('📊 [Get Reviews by Tenant] Rating distribution:', ratingStats);

  const statistics: ReviewStatistics = {
    average_rating: Number(averageRating.toFixed(1)),
    total_reviews: allFilteredReviews.length,
    rating_distribution: ratingStats,
  };

  console.log('📊 [Get Reviews by Tenant] Statistics completed:', statistics);

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

  console.log('✅ [Get Reviews by Tenant] Process completed successfully');
  console.log('📋 [Get Reviews by Tenant] Final result summary:');
  console.log('   - Reviews returned:', reviews.length);
  console.log('   - Total reviews in DB:', totalCount);
  console.log('   - Current page:', page, 'of', totalPages);
  console.log('   - Average rating:', statistics.average_rating);

  return result;
};
