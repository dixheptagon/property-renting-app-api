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
exports.GetSalesReportService = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
class GetSalesReportService {
    static getSalesReport(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tenantId, propertyId, startDate, endDate } = params;
            // Fetch bookings
            const bookings = yield prisma_client_1.default.booking.findMany({
                where: {
                    property_id: propertyId,
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    id: true,
                    total_price: true,
                    status: true,
                    created_at: true,
                },
            });
            // Calculate totals
            const totalOrders = bookings.length;
            const completedOrders = bookings.filter((b) => b.status === 'completed').length;
            const cancelledOrders = bookings.filter((b) => b.status === 'cancelled').length;
            const totalRevenue = bookings
                .filter((b) => b.status === 'completed')
                .reduce((sum, b) => sum + Number(b.total_price), 0);
            // Determine grouping by weeks
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            const totalWeeks = Math.ceil(diffDays / 7);
            let groupSize;
            if (totalWeeks <= 4) {
                groupSize = 1; // 1 month: individual weeks
            }
            else if (totalWeeks <= 8) {
                groupSize = 2; // 2 months: 2 weeks each
            }
            else if (totalWeeks <= 12) {
                groupSize = 3; // 3 months: 3 weeks each
            }
            else {
                groupSize = 4; // 6 months: 4 weeks each
            }
            // Group by periods
            const periods = [];
            let weekStart = 1;
            while (weekStart <= totalWeeks) {
                const weekEnd = Math.min(weekStart + groupSize - 1, totalWeeks);
                const periodStart = new Date(startDate);
                periodStart.setDate(periodStart.getDate() + (weekStart - 1) * 7);
                const periodEnd = new Date(startDate);
                periodEnd.setDate(periodEnd.getDate() + weekEnd * 7);
                if (periodEnd > endDate)
                    periodEnd.setTime(endDate.getTime());
                const periodCompleted = bookings.filter((b) => b.status === 'completed' &&
                    b.created_at >= periodStart &&
                    b.created_at < periodEnd).length;
                const periodCancelled = bookings.filter((b) => b.status === 'cancelled' &&
                    b.created_at >= periodStart &&
                    b.created_at < periodEnd).length;
                periods.push({
                    period: `Week ${weekStart}-${weekEnd}`,
                    completed: periodCompleted,
                    cancelled: periodCancelled,
                });
                weekStart += groupSize;
            }
            const result = {
                totalRevenue,
                totalOrders,
                completedOrders,
                cancelledOrders,
                periods,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            };
            return result;
        });
    }
}
exports.GetSalesReportService = GetSalesReportService;
