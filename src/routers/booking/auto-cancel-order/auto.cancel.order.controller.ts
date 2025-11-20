import cron from 'node-cron';
import database from '../../../lib/config/prisma.client';

export const AutoCancelOrder = () => {
  // Run every hour to auto-cancel pending payments after 2 hours
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const result = await database.booking.updateMany({
        where: {
          status: 'pending_payment',
          payment_deadline: {
            lt: now,
          },
        },
        data: {
          status: 'cancelled',
        },
      });

      if (result.count > 0) {
        console.log(
          `Auto-cancelled ${result.count} pending bookings at ${now.toISOString()}`,
        );
      }
    } catch (error) {
      console.error('Error in auto-cancel cron job:', error);
    }
  });
};
