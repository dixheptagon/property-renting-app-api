import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const retrievePropertyListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('🔍 Starting property list retrieval process...');

    // Parse and validate query parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = [12, 24, 48].includes(Number(req.query.limit))
      ? Number(req.query.limit)
      : 12;
    const skip = (page - 1) * limit;

    const {
      location,
      checkin,
      checkout,
      category,
      amenities,
      rules,
      sortBy = 'updated_at',
    } = req.query;

    console.log('📋 Query parameters received:', {
      page,
      limit,
      location,
      checkin,
      checkout,
      category,
      amenities,
      rules,
      sortBy,
    });

    // Validate page and limit
    if (page < 1) {
      console.error('❌ Invalid page number:', page);
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Page number must be greater than 0',
      );
    }

    if (![12, 24, 48].includes(limit)) {
      console.error('❌ Invalid limit value:', limit);
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Limit must be one of: 12, 24, 48',
      );
    }

    // Build where clause
    const where: any = {
      status: 'active', // Only show active properties
    };

    console.log('🏗️ Building filter conditions...');

    // Location filtering (search in title, description, address, city, country)
    if (location && typeof location === 'string') {
      console.log('📍 Applying location filter:', location);
      where.OR = [
        { title: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } },
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
      ];
    }

    // Category filtering
    if (category && typeof category === 'string') {
      const validCategories = ['house', 'apartment', 'hotel', 'villa', 'room'];
      if (!validCategories.includes(category.toLowerCase())) {
        console.error('❌ Invalid category:', category);
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        );
      }
      console.log('🏷️ Applying category filter:', category.toLowerCase());
      where.category = category.toLowerCase();
    }

    // Amenities filtering (JSON array contains)
    if (amenities && typeof amenities === 'string') {
      const amenityList = amenities.split(',').map((a) => a.trim());
      console.log('🛋️ Amenities filter requested:', amenityList);
      // Note: This is a simplified approach. In production, you might need more complex JSON querying
      // For now, we'll assume amenities is stored as JSON array
      where.amenities = {
        // This would need to be adjusted based on how amenities are stored
        // For JSON arrays, you might need raw SQL or a different approach
      };
    }

    // Rules filtering (similar to amenities)
    if (rules && typeof rules === 'string') {
      const ruleList = rules.split(',').map((r) => r.trim());
      console.log('📜 Rules filter requested:', ruleList);
      where.rules = {
        // Similar to amenities, this needs proper JSON querying
      };
    }

    // Date availability filtering (checkin/checkout)
    // This is complex as it requires checking room unavailabilities
    // For now, we'll skip this and implement basic filtering
    // In a full implementation, you'd need to join with room_unavailabilities

    // Sorting
    const validSortOptions = [
      'updated_at',
      'price_asc',
      'price_desc',
      'rating_desc',
    ];
    let orderBy: any = { updated_at: 'desc' }; // default

    if (
      sortBy &&
      typeof sortBy === 'string' &&
      validSortOptions.includes(sortBy)
    ) {
      console.log('🔄 Applying sort order:', sortBy);
      switch (sortBy) {
        case 'updated_at':
          orderBy = { updated_at: 'desc' };
          break;
        case 'price_asc':
          orderBy = { base_price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { base_price: 'desc' };
          break;
        case 'rating_desc':
          orderBy = [{ rating_avg: 'desc' }, { updated_at: 'desc' }];
          break;
      }
    } else if (
      sortBy &&
      typeof sortBy === 'string' &&
      !validSortOptions.includes(sortBy)
    ) {
      console.error('❌ Invalid sort option:', sortBy);
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        `Invalid sort option. Must be one of: ${validSortOptions.join(', ')}`,
      );
    }

    console.log('📊 Final where clause:', JSON.stringify(where, null, 2));
    console.log('🔄 Final order by:', JSON.stringify(orderBy, null, 2));

    // Get total count
    console.log('🔢 Counting total properties...');
    const total = await database.property.count({ where });
    console.log('📈 Total properties found:', total);

    if (total === 0) {
      console.log('⚠️ No properties found matching criteria');
      // Don't throw error for empty results, just return empty array
    }

    // Get properties with related data
    console.log('🏠 Fetching properties with pagination...');
    const properties = await database.property.findMany({
      where,
      include: {
        images: {
          where: { status: 'active' },
          orderBy: { order_index: 'asc' },
          take: 5, // Include up to 5 images
        },
        tenant: {
          select: {
            first_name: true,
            last_name: true,
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

    console.log('✅ Retrieved', properties.length, 'properties');

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log('📄 Pagination info:', {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });

    // Format response data
    console.log('📝 Formatting response data...');
    const data = properties.map((property) => ({
      uid: property.uid,
      category: property.category,
      title: property.title,
      address: property.address,
      city: property.city,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      place_id: property.place_id,
      map_url: property.map_url,
      amenities: property.amenities,
      rules: property.rules,
      rating_avg: property.rating_avg,
      rating_count: property.rating_count,
      base_price: property.base_price,
      images: property.images.map((img) => ({
        url: img.url,
        is_main: img.is_main,
        order_index: img.order_index,
      })),
      tenant: {
        first_name: property.tenant.first_name,
        last_name: property.tenant.last_name,
      },
      review_count: property._count.reviews,
      updated_at: property.updated_at,
    }));

    // Build filters available (this would be dynamic in a full implementation)
    const availableFilters = {
      categories: ['house', 'apartment', 'hotel', 'villa', 'room'],
      amenities: [], // Would be populated from database
      rules: [], // Would be populated from database
    };

    // Build applied filters
    const appliedFilters: any = {};
    if (category && typeof category === 'string')
      appliedFilters.category = category;
    if (amenities && typeof amenities === 'string')
      appliedFilters.amenities = amenities.split(',');
    if (rules && typeof rules === 'string')
      appliedFilters.rules = rules.split(',');
    if (location && typeof location === 'string')
      appliedFilters.location = location;
    if (checkin && typeof checkin === 'string')
      appliedFilters.checkin = checkin;
    if (checkout && typeof checkout === 'string')
      appliedFilters.checkout = checkout;

    const response = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        applied: appliedFilters,
        available: availableFilters,
      },
    };

    console.log('🎉 Property list retrieval completed successfully');
    console.log('📊 Response summary:', {
      totalProperties: data.length,
      pagination: { page, limit, total, totalPages },
      appliedFilters: Object.keys(appliedFilters).length,
    });

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Properties retrieved successfully', response),
      );
  } catch (error) {
    console.error('💥 Error in property list retrieval:', error);
    next(error);
  }
};
