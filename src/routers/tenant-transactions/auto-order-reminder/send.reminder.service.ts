import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Handlebars from 'handlebars';
import transporter from '../../../lib/config/nodemailer.transporter.js';
import database from '../../../lib/config/prisma.client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SendReminderService {
  private static async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: any,
    attachments: any[] = [],
  ): Promise<void> {
    try {
      const templateHtmlDir = path.resolve(__dirname, '../../../lib/template');
      const templateHtmlPath = path.join(templateHtmlDir, templateName);

      const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateHtml);

      const htmlToSend = compiledTemplate(templateData);

      await transporter.sendMail({
        from: 'Staysia <admin@gmail.com>',
        to,
        subject,
        html: htmlToSend,
        attachments,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email notification');
    }
  }

  static async sendBookingReminderEmail(bookingId: number): Promise<void> {
    const booking = await database.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        room: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const checkInDate = new Date(booking.check_in_date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const checkOutDate = new Date(booking.check_out_date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const templateData = {
      uid: booking.uid || `BK${booking.id.toString().padStart(10, '0')}`,
      property_name: booking.property.title,
      room_name: booking.room.name,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      fullname: booking.fullname,
      total_price: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(Number(booking.total_price)),
      booking_detail_url: `https://staysia.com/booking/${booking.uid || `BK${booking.id.toString().padStart(10, '0')}`}`,
      check_in_time: '14:00', // Assuming default check-in time, can be made configurable
      current_year: new Date().getFullYear(),
    };

    await this.sendEmail(
      booking.email,
      `Reminder: Your stay begins tomorrow - ${templateData.uid}`,
      'order.reminder.html',
      templateData,
    );
  }
}
