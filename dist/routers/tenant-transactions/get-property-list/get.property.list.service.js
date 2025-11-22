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
exports.GetPropertyListService = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
class GetPropertyListService {
    static getPropertyListByTenant(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tenantId, status, category, page, limit, sortBy = 'created_at', sortDir = 'desc', } = params;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {
                user_id: tenantId,
            };
            if (status) {
                where.status = status;
            }
            if (category) {
                where.category = category;
            }
            // Build orderBy
            const orderBy = {};
            orderBy[sortBy] = sortDir;
            // Get total count
            const total = yield prisma_client_1.default.property.count({ where });
            // Get properties with related data
            const properties = yield prisma_client_1.default.property.findMany({
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
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found');
            }
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            // Format response data
            const data = properties.map((property) => {
                var _a;
                // Calculate review summary
                const reviewCount = property._count.reviews;
                const averageRating = reviewCount > 0
                    ? property.reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewCount
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
                    main_image: ((_a = property.images.find((image) => image.is_main)) === null || _a === void 0 ? void 0 : _a.url) || null,
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
        });
    }
}
exports.GetPropertyListService = GetPropertyListService;
