import database from '../../../lib/config/prisma.client';
import {
  GetSalesReportParams,
  SalesReportResponse,
} from './get.sales.report.types';

export class GetSalesReportService {
  static async getSalesReport(
    params: GetSalesReportParams,
  ): Promise<SalesReportResponse> {
    const { tenantId, propertyId, startDate, endDate } = params;

    console.log('Service - Tenant ID:', tenantId);
    console.log('Service - Property ID:', propertyId);
    console.log('Service - Date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    // Fetch bookings
    const bookings = await database.booking.findMany({
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
    console.log('Service - Number of bookings fetched:', bookings.length);

    // Calculate totals
    const totalOrders = bookings.length;
    const completedOrders = bookings.filter(
      (b) => b.status === 'completed',
    ).length;
    const cancelledOrders = bookings.filter(
      (b) => b.status === 'cancelled',
    ).length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.total_price), 0);

    console.log('Service - Totals:', {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    });

    // Determine grouping by weeks
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    const totalWeeks = Math.ceil(diffDays / 7);
    console.log('Service - Date calculations:', { diffDays, totalWeeks });

    let groupSize: number;
    if (totalWeeks <= 4) {
      groupSize = 1; // 1 month: individual weeks
    } else if (totalWeeks <= 8) {
      groupSize = 2; // 2 months: 2 weeks each
    } else if (totalWeeks <= 12) {
      groupSize = 3; // 3 months: 3 weeks each
    } else {
      groupSize = 4; // 6 months: 4 weeks each
    }
    console.log('Service - Group size:', groupSize);

    // Group by periods
    const periods: { period: string; completed: number; cancelled: number }[] =
      [];
    let weekStart = 1;

    while (weekStart <= totalWeeks) {
      const weekEnd = Math.min(weekStart + groupSize - 1, totalWeeks);
      const periodStart = new Date(startDate);
      periodStart.setDate(periodStart.getDate() + (weekStart - 1) * 7);

      const periodEnd = new Date(startDate);
      periodEnd.setDate(periodEnd.getDate() + weekEnd * 7);

      if (periodEnd > endDate) periodEnd.setTime(endDate.getTime());

      const periodCompleted = bookings.filter(
        (b) =>
          b.status === 'completed' &&
          b.created_at >= periodStart &&
          b.created_at < periodEnd,
      ).length;

      const periodCancelled = bookings.filter(
        (b) =>
          b.status === 'cancelled' &&
          b.created_at >= periodStart &&
          b.created_at < periodEnd,
      ).length;

      periods.push({
        period: `Week ${weekStart}-${weekEnd}`,
        completed: periodCompleted,
        cancelled: periodCancelled,
      });
      console.log(`Service - Period ${weekStart}-${weekEnd}:`, {
        completed: periodCompleted,
        cancelled: periodCancelled,
      });

      weekStart += groupSize;
    }

    const result: SalesReportResponse = {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      periods,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    console.log('Service - Final result:', result);
    return result;
  }
}
