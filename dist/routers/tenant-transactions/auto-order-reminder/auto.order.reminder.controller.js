import cron from 'node-cron';
import database from '../../../lib/config/prisma.client.js';
import { SendReminderService } from './send.reminder.service.js';
export const AutoOrderReminderController = () => {
    // Run daily at 00:00 server time to send reminder emails for tomorrow's check-ins
    cron.schedule('0 0 * * *', async () => {
        try {
            // Calculate tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
            // Query bookings with check_in_date = tomorrow and status in ['confirmed', 'processing']
            const bookings = await database.booking.findMany({
                where: {
                    check_in_date: {
                        equals: new Date(tomorrowDate),
                    },
                    status: {
                        in: ['confirmed', 'processing'],
                    },
                },
                include: {
                    property: true,
                    room: true,
                },
            });
            // Send reminder emails
            const emailPromises = bookings.map(async (booking) => {
                try {
                    await SendReminderService.sendBookingReminderEmail(booking.id);
                }
                catch (error) {
                    console.error(`Failed to send reminder email for booking ID: ${booking.id}`, error);
                }
            });
            await Promise.all(emailPromises);
        }
        catch (error) {
            console.error('Error in auto order reminder cron job:', error);
        }
    });
};
