import database from '../../../lib/config/prisma.client';
import {
  GetPropertyReportParams,
  PropertyReportResponse,
} from './get.property.report.types';

export class GetPropertyReportService {
  static async getPropertyReport(
    params: GetPropertyReportParams,
  ): Promise<PropertyReportResponse> {
    const { tenantId, propertyId, roomId, selectedDate } = params;

    console.log('Service - Tenant ID:', tenantId);
    console.log('Service - Property ID:', propertyId);
    console.log('Service - Room ID:', roomId || 'Not specified');
    console.log(
      'Service - Selected Date:',
      selectedDate.toISOString().split('T')[0],
    );

    // Build room filter
    let roomFilter: any = { property_id: propertyId };

    if (roomId) {
      roomFilter.id = roomId;
    }

    // Get total units by summing total_units from matching rooms
    const roomsData = await database.room.findMany({
      where: roomFilter,
      select: { total_units: true },
    });

    const totalUnits = roomsData.reduce(
      (sum, room) => sum + room.total_units,
      0,
    );

    console.log('Service - Total units:', totalUnits);

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
            'pending_payment' as const,
            'processing' as const,
            'confirmed' as const,
            'completed' as const,
          ],
        },
      },
    };

    const bookedUnitsCount = await database.booking.count(bookedUnitsQuery);

    console.log('Service - Booked units:', bookedUnitsCount);

    // Calculate metrics
    const availableUnits = totalUnits - bookedUnitsCount;
    const occupancyRate = Math.round((bookedUnitsCount / totalUnits) * 100);

    const result: PropertyReportResponse = {
      booked_units: bookedUnitsCount,
      available_units: availableUnits,
      total_units: totalUnits,
      occupancy_rate: occupancyRate,
      selected_date: selectedDate.toISOString().split('T')[0],
    };

    console.log('Service - Final result:', result);
    return result;
  }
}
