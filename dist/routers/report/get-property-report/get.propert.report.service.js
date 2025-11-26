import database from '../../../lib/config/prisma.client.js';
export class GetPropertyReportService {
    static async getPropertyReport(params) {
        const { tenantId, propertyId, roomId, selectedDate } = params;
        // Build room filter
        let roomFilter = { property_id: propertyId };
        if (roomId) {
            roomFilter.id = roomId;
        }
        // Get total units by summing total_units from matching rooms
        const roomsData = await database.room.findMany({
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
        const bookedUnitsCount = await database.booking.count(bookedUnitsQuery);
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
    }
}
