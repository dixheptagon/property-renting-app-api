import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
export const getReviewsByPropertyId = async (propertyId, params) => {
    const { page, limit, rating, sort_by, sort_dir, search } = params;
    // Find property by uid
    const property = await database.property.findUnique({
        where: { uid: propertyId },
        select: {
            id: true,
            uid: true,
            tenant: {
                select: { first_name: true, last_name: true, display_name: true },
            },
        },
    });
    if (!property) {
        throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Property not found');
    }
    const propertyIdNum = property.id;
    // Build where clause
    const where = {
        property_id: propertyIdNum,
        is_public: true, // Only public reviews
    };
    // Rating filter
    if (rating) {
        const ratingArray = Array.isArray(rating)
            ? rating.map((r) => parseInt(r, 10)).filter((r) => !isNaN(r))
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
    const orderBy = {};
    if (sort_by) {
        orderBy[sort_by] = sort_dir || 'desc';
    }
    else {
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
                    room: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            property: {
                select: {
                    tenant: {
                        select: {
                            first_name: true,
                            last_name: true,
                            display_name: true,
                        },
                    },
                },
            },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
    });
    // Get total count
    const totalCount = await database.review.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const allFilteredReviews = await database.review.findMany({
        where,
        select: {
            rating: true,
        },
    });
    // Calculate average rating
    const averageRating = allFilteredReviews.length > 0
        ? allFilteredReviews.reduce((sum, review) => sum + Number(review.rating), 0) / allFilteredReviews.length
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
        const rating = Math.floor(Number(review.rating));
        if (rating >= 1 && rating <= 5) {
            ratingStats[rating]++;
        }
    });
    // Map reviews to ReviewData
    const reviewData = reviews.map((review) => {
        const user = review.user;
        const username = user.display_name || `${user.first_name} ${user.last_name || ''}`.trim();
        const tenant = review.property.tenant;
        const tenantName = tenant.display_name ||
            `${tenant.first_name} ${tenant.last_name || ''}`.trim();
        return {
            username,
            roomTypeName: review.booking.room.name,
            reviewComment: review.comment,
            createdAt: review.created_at,
            rating: Number(review.rating),
            tenantName,
            tenantReply: review.reply || undefined,
            updatedAt: review.updated_at || review.created_at,
        };
    });
    const result = {
        reviews: reviewData,
        statistics: {
            totalReviews: allFilteredReviews.length,
            averageRating: Number(averageRating.toFixed(1)),
            ratingStatistics: ratingStats,
        },
        pagination: {
            page,
            limit,
            totalPages,
            totalItems: totalCount,
        },
    };
    return result;
};
