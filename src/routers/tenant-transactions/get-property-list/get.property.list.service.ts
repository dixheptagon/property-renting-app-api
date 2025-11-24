import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import {
  GetPropertyListParams,
  PropertyListResponse,
} from './get.property.list.types.js';

export class GetPropertyListService {
  static async getPropertyListByTenant(
    params: GetPropertyListParams,
  ): Promise<PropertyListResponse> {
    const {
      tenantId,
      status,
      category,
      page,
      limit,
      sortBy = 'created_at',
      sortDir = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user_id: tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortDir;

    // Get total count
    const total = await database.property.count({ where });

    // Get properties with related data
    const properties = await database.property.findMany({
      where,
      include: {
        images: {
          where: { status: 'active', is_main: true },
          take: 1,
        },
        reviews: {
          where: { is_public: true },
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    if (!properties) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property not found',
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Format response data
    const data = properties.map((property) => {
      // Calculate review summary
      const reviewCount = property._count.reviews;
      const averageRating =
        reviewCount > 0
          ? property.reviews.reduce(
              (sum, review) => sum + Number(review.rating),
              0,
            ) / reviewCount
          : null;

      return {
        uid: property.uid,
        category: property.category,
        status: property.status,
        title: property.title,
        location: {
          address: property.address,
          city: property.city,
          country: property.country,
          latitude: property.latitude,
          longitude: property.longitude,
        },
        review_summary: {
          average_rating: averageRating
            ? Number(averageRating.toFixed(1))
            : null,
          review_count: reviewCount,
        },
        main_image: property.images.find((image) => image.is_main)?.url || null,
        created_at: property.created_at,
        updated_at: property.updated_at,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }
}
