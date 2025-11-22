"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyDetails = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const http_response_1 = require("../../../lib/constant/http.response");
const custom_error_1 = require("../../../lib/utils/custom.error");
const getPropertyDetails = (uid) => __awaiter(void 0, void 0, void 0, function* () {
    // Find property with all required relations
    const property = yield prisma_client_1.default.property.findFirst({
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
        },
    });
    if (!property) {
        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found');
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
        rating_avg: property.rating_avg,
        rating_count: property.rating_count,
        base_price: property.base_price,
        status: property.status,
        tenant,
        images,
        rooms,
        room_unavailabilities,
        peak_season_rates,
    };
});
exports.getPropertyDetails = getPropertyDetails;
