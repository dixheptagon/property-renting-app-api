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
exports.GetOrderListService = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
class GetOrderListService {
    static getOrderListByTenant(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tenantId, status: baseStatus = [], // default kosong
            category, dateFrom, dateTo, page, limit = 10, sortBy = 'created_at', sortDir = 'desc', } = params;
            const skip = (page - 1) * limit;
            // === 1. FILTER UMUM (tenant, category, date) ===
            const filterWhere = {
                property: { user_id: tenantId },
            };
            if (category === null || category === void 0 ? void 0 : category.length) {
                filterWhere.property.category = { in: category };
            }
            if (dateFrom || dateTo) {
                filterWhere.check_in_date = {};
                if (dateFrom)
                    filterWhere.check_in_date.gte = dateFrom;
                if (dateTo)
                    filterWhere.check_in_date.lte = dateTo;
            }
            // === 2. STATUS FILTER DARI USER ===
            const hasStatusFilter = baseStatus.length > 0;
            const statusFilter = hasStatusFilter ? { status: { in: baseStatus } } : {};
            // === 3. WHERE UNTUK LIST & TOTAL (ikut status filter) ===
            const listWhere = hasStatusFilter
                ? Object.assign(Object.assign({}, filterWhere), statusFilter) : filterWhere;
            // === 4. SORTING ===
            const orderBy = {};
            const validSortFields = [
                'created_at',
                'check_in_date',
                'total_price',
            ];
            if (validSortFields.includes(sortBy)) {
                orderBy[sortBy] = sortDir === 'asc' ? 'asc' : 'desc';
            }
            else {
                orderBy.created_at = 'desc';
            }
            // === 5. GET TOTAL & LIST ===
            const total = yield prisma_client_1.default.booking.count({ where: listWhere });
            const bookings = yield prisma_client_1.default.booking.findMany({
                where: listWhere,
                include: {
                    property: { select: { title: true, address: true, city: true } },
                    room: { select: { name: true, description: true } },
                    user: { select: { first_name: true, last_name: true, email: true } },
                },
                orderBy,
                skip,
                take: limit,
            });
            if (bookings.length === 0) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'No orders found matching the criteria');
            }
            // === 6. STATISTICS: IKUT STATUS FILTER ===
            const countByStatus = (targetStatus) => __awaiter(this, void 0, void 0, function* () {
                if (!hasStatusFilter) {
                    // Tidak ada filter → hitung semua yang status = target
                    return prisma_client_1.default.booking.count({
                        where: Object.assign(Object.assign({}, filterWhere), { status: targetStatus }),
                    });
                }
                // Ada filter → hitung hanya yang (status IN baseStatus) AND status = target
                return prisma_client_1.default.booking.count({
                    where: Object.assign(Object.assign({}, filterWhere), { AND: [statusFilter, { status: targetStatus }] }),
                });
            });
            const [totalCompleted, totalCancelled, totalPending, totalProcessing, totalConfirmed,] = yield Promise.all([
                countByStatus('completed'),
                countByStatus('cancelled'),
                countByStatus('pending_payment'),
                countByStatus('processing'),
                countByStatus('confirmed'),
            ]);
            // === 7. FORMAT RESPONSE ===
            const data = bookings.map((booking) => ({
                orderId: booking.uid || `ORDER-${booking.id}`,
                status: booking.status,
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                total_price: Number(booking.total_price),
                property: {
                    name: booking.property.title,
                    address: booking.property.address,
                    city: booking.property.city,
                },
                room: {
                    name: booking.room.name,
                    description: booking.room.description,
                },
                user: {
                    name: `${booking.user.first_name} ${booking.user.last_name || ''}`.trim(),
                    email: booking.user.email,
                },
            }));
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
                statistics: {
                    total_order: total,
                    total_completed: totalCompleted,
                    total_cancelled: totalCancelled,
                    total_pending: totalPending,
                    total_processing: totalProcessing,
                    total_confirmed: totalConfirmed,
                },
            };
        });
    }
}
exports.GetOrderListService = GetOrderListService;
