import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Handlebars from 'handlebars';
import transporter from '../../../lib/config/nodemailer.transporter.js';
import database from '../../../lib/config/prisma.client.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class SendConfirmationService {
    static async sendEmail(to, subject, templateName, templateData, attachments = []) {
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
        }
        catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send email notification');
        }
    }
    static async sendBookingConfirmationEmail(bookingId) {
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
        const checkInDate = new Date(booking.check_in_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const checkOutDate = new Date(booking.check_out_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const paidAt = booking.paid_at
            ? new Date(booking.paid_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
            : 'N/A';
        // Calculate duration in nights
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const duration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const templateData = {
            order_id: booking.uid || `BK${booking.id.toString().padStart(10, '0')}`,
            property_title: booking.property.title,
            property_address: `${booking.property.address}, ${booking.property.city}, ${booking.property.country} ${booking.property.postal_code}`,
            room_name: booking.room.name,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            duration: duration,
            capacity: booking.room.max_guest,
            fullname: booking.fullname,
            email: booking.email,
            phone_number: booking.phone_number,
            total_price: new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(Number(booking.total_price)),
            payment_method: booking.payment_method || 'Bank Transfer',
            paid_at: paidAt,
            current_year: new Date().getFullYear(),
        };
        const attachment = [
            {
                filename: 'guest-guidelines.pdf',
                path: path.join(__dirname, '../../../lib/template/assets/guest-guidelines.pdf'),
                contentType: 'application/pdf',
            },
        ];
        await this.sendEmail(booking.email, `Your booking has been confirmed - ${templateData.order_id}`, 'confirmed.booking.html', templateData, attachment);
    }
}
