import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { formatNumberShort } from './format.number.to.short.js';
export const retrievePropertyListController = async (req, res, next) => {
    try {
        // Parse and validate query parameters
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = [12, 24, 48].includes(Number(req.query.limit))
            ? Number(req.query.limit)
            : 12;
        const skip = (page - 1) * limit;
        const { location, checkin, checkout, category, sortBy = 'updated_at', } = req.query;
        // Parse and validate checkin and checkout dates
        let checkinDate = null;
        let checkoutDate = null;
        if (checkin && typeof checkin === 'string') {
            checkinDate = new Date(checkin);
            if (isNaN(checkinDate.getTime())) {
                console.error('❌ Invalid checkin date:', checkin);
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid checkin date format. Use YYYY-MM-DD');
            }
        }
        if (checkout && typeof checkout === 'string') {
            checkoutDate = new Date(checkout);
            if (isNaN(checkoutDate.getTime())) {
                console.error('❌ Invalid checkout date:', checkout);
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid checkout date format. Use YYYY-MM-DD');
            }
        }
        if (checkinDate && checkoutDate && checkinDate >= checkoutDate) {
            console.error('❌ Checkin date is not before checkout date');
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Checkin date must be before checkout date');
        }
        // Validate page and limit
        if (page < 1) {
            console.error('❌ Invalid page number:', page);
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Page number must be greater than 0');
        }
        if (![12, 24, 48].includes(limit)) {
            console.error('❌ Invalid limit value:', limit);
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Limit must be one of: 12, 24, 48');
        }
        // Build where clause
        const where = {
            status: 'active', // Only show active properties
        };
        // Filter by room unavailability if checkin and checkout are provided
        if (checkinDate && checkoutDate) {
            where.NOT = {
                room_unavailabilities: {
                    some: {
                        start_date: { lte: checkoutDate },
                        end_date: { gte: checkinDate },
                    },
                },
            };
        }
        // Location filtering (search in title, description, address, city, country)
        if (location && typeof location === 'string') {
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
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
            }
            where.category = category.toLowerCase();
        }
        // Sorting
        const validSortOptions = [
            'updated_at',
            'price_asc',
            'price_desc',
            'rating_desc',
        ];
        let orderBy = { updated_at: 'desc' }; // default
        if (sortBy &&
            typeof sortBy === 'string' &&
            validSortOptions.includes(sortBy)) {
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
        }
        else if (sortBy &&
            typeof sortBy === 'string' &&
            !validSortOptions.includes(sortBy)) {
            console.error('❌ Invalid sort option:', sortBy);
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, `Invalid sort option. Must be one of: ${validSortOptions.join(', ')}`);
        }
        // Get total count
        const total = await database.property.count({ where });
        if (total === 0) {
            console.error('⚠️ No properties found matching criteria');
            // Don't throw error for empty results, just return empty array
        }
        // Get properties with related data
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
        // get revies count
        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        // Format response data
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
            review_count: formatNumberShort(property._count.reviews),
            rating_avg: property._count.reviews > 0
                ? property.reviews.reduce((sum, review) => sum + Number(review.rating), 0) / property._count.reviews
                : null,
            updated_at: property.updated_at,
        }));
        // Build filters available (this would be dynamic in a full implementation)
        const availableFilters = {
            categories: ['house', 'apartment', 'hotel', 'villa', 'room'],
        };
        // Build applied filters
        const appliedFilters = {};
        if (category && typeof category === 'string')
            appliedFilters.category = category;
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
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Properties retrieved successfully', response));
    }
    catch (error) {
        console.error('💥 Error in property list retrieval:', error);
        next(error);
    }
};
