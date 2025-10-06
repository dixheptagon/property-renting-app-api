import cron from 'node-cron';
import database from '../../../lib/config/prisma.client';

export const AutoCompleteOrderController = () => {
  // Run daily at 00:00 server time to auto-complete orders where check-out date has passed 6 hours ago
  cron.schedule('0 0 * * *', async () => {
    try {
      // Calculate the date 6 hours ago
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      // Query bookings with status = confirmed and check_out_date < sixHoursAgo
      const bookingsToComplete = await database.booking.findMany({
        where: {
          status: 'confirmed',
          check_out_date: {
            lt: sixHoursAgo,
          },
        },
      });

      // Update bookings to completed status
      const updatePromises = bookingsToComplete.map(async (booking) => {
        try {
          await database.booking.update({
            where: { id: booking.id },
            data: {
              status: 'completed',
            },
          });
          console.log(
            `Auto-completed order ${booking.uid} (ID: ${booking.id})`,
          );
        } catch (error) {
          console.error(
            `Failed to auto-complete booking ID: ${booking.id}, UID: ${booking.uid}`,
            error,
          );
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error in auto-complete order cron job:', error);
    }
  });
};
