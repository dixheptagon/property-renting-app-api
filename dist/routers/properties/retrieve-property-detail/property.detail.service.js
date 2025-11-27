import database from '../../../lib/config/prisma.client.js';
import { Decimal } from '@prisma/client/runtime/library';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
export const getPropertyDetails = async (uid) => {
    // Find property with all required relations
    const property = await database.property.findFirst({
        where: {
            uid,
            status: 'active',
            deleted_at: null,
        },
        include: {
            tenant: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    display_name: true,
                    image: true,
                },
            },
            images: {
                where: { status: 'active' },
                orderBy: { order_index: 'asc' },
            },
            rooms: {
                where: { deleted_at: null },
                include: {
                    images: {
                        where: { status: 'active' },
                        orderBy: { order_index: 'asc' },
                    },
                },
            },
            room_unavailabilities: true,
            peak_season_rates: true,
            reviews: true,
        },
    });
    if (!property) {
        throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Property not found');
    }
    // Calculate rating average and count from reviews
    const validReviews = property.reviews.filter((review) => review.is_public === true && review.deleted_at === null);
    const rating_count = validReviews.length;
    let rating_avg = null;
    if (rating_count > 0) {
        const total = validReviews.reduce((sum, review) => sum.add(review.rating), new Decimal(0));
        rating_avg = total
            .div(rating_count)
            .toDecimalPlaces(1, Decimal.ROUND_HALF_UP);
    }
    // Format tenant data
    const tenant = {
        id: property.tenant.id,
        name: property.tenant.display_name ||
            `${property.tenant.first_name} ${property.tenant.last_name || ''}`.trim(),
        display_name: property.tenant.display_name,
        profile_picture_url: property.tenant.image || '',
    };
    // Format images
    const images = property.images.map((img) => ({
        id: img.id,
        url: img.url,
        is_main: img.is_main,
        order_index: img.order_index,
    }));
    // Format rooms
    const rooms = property.rooms.map((room) => ({
        id: room.id,
        uid: room.uid,
        name: room.name,
        description: room.description,
        base_price: room.base_price,
        max_guest: room.max_guest,
        bedrooms: room.bedrooms,
        bathrooms: room.bathrooms,
        beds: room.beds,
        highlight: room.highlight,
        custom_highlight: room.custom_highlight,
        total_units: room.total_units,
        images: room.images.map((img) => ({
            url: img.url,
            is_main: img.is_main,
            order_index: img.order_index,
        })),
    }));
    // Format room unavailabilities
    const room_unavailabilities = property.room_unavailabilities.map((unavailability) => ({
        id: unavailability.id,
        room_id: unavailability.room_id,
        start_date: unavailability.start_date,
        end_date: unavailability.end_date,
        reason: unavailability.reason,
    }));
    // Format peak season rates
    const peak_season_rates = property.peak_season_rates.map((rate) => ({
        id: rate.id,
        room_id: rate.room_id,
        start_date: rate.start_date,
        end_date: rate.end_date,
        adjustment_type: rate.adjustment_type,
        adjustment_value: rate.adjustment_value,
    }));
    return {
        uid: property.uid,
        category: property.category,
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
        country: property.country,
        postal_code: property.postal_code,
        latitude: property.latitude,
        longitude: property.longitude,
        place_id: property.place_id,
        map_url: property.map_url,
        amenities: property.amenities,
        custom_amenities: property.custom_amenities,
        rules: property.rules,
        custom_rules: property.custom_rules,
        rating_avg,
        rating_count,
        base_price: property.base_price,
        status: property.status,
        tenant,
        images,
        rooms,
        room_unavailabilities,
        peak_season_rates,
    };
};
