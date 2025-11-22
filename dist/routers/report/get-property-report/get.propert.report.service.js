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
exports.GetPropertyReportService = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
class GetPropertyReportService {
    static getPropertyReport(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tenantId, propertyId, roomId, selectedDate } = params;
            // Build room filter
            let roomFilter = { property_id: propertyId };
            if (roomId) {
                roomFilter.id = roomId;
            }
            // Get total units by summing total_units from matching rooms
            const roomsData = yield prisma_client_1.default.room.findMany({
                where: roomFilter,
                select: { total_units: true },
            });
            const totalUnits = roomsData.reduce((sum, room) => sum + room.total_units, 0);
            if (totalUnits === 0) {
                // Return zero values if no units found
                return {
                    booked_units: 0,
                    available_units: 0,
                    total_units: 0,
                    occupancy_rate: 0,
                    selected_date: selectedDate.toISOString().split('T')[0],
                };
            }
            // Get booked units count for the selected date
            // A unit is booked if there's a booking where check_in <= selected_date < check_out
            // and the booking is not cancelled
            const bookedUnitsQuery = {
                where: {
                    room: roomFilter,
                    check_in_date: { lte: selectedDate },
                    check_out_date: { gt: selectedDate },
                    status: {
                        in: [
                            'pending_payment',
                            'processing',
                            'confirmed',
                            'completed',
                        ],
                    },
                },
            };
            const bookedUnitsCount = yield prisma_client_1.default.booking.count(bookedUnitsQuery);
            // Calculate metrics
            const availableUnits = totalUnits - bookedUnitsCount;
            const occupancyRate = Math.round((bookedUnitsCount / totalUnits) * 100);
            const result = {
                booked_units: bookedUnitsCount,
                available_units: availableUnits,
                total_units: totalUnits,
                occupancy_rate: occupancyRate,
                selected_date: selectedDate.toISOString().split('T')[0],
            };
            return result;
        });
    }
}
exports.GetPropertyReportService = GetPropertyReportService;
