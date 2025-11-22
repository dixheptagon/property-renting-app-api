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
exports.SendConfirmationService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const nodemailer_transporter_1 = __importDefault(require("../../../lib/config/nodemailer.transporter"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
class SendConfirmationService {
    static sendEmail(to_1, subject_1, templateName_1, templateData_1) {
        return __awaiter(this, arguments, void 0, function* (to, subject, templateName, templateData, attachments = []) {
            try {
                const templateHtmlDir = path_1.default.resolve(__dirname, '../../../lib/template');
                const templateHtmlPath = path_1.default.join(templateHtmlDir, templateName);
                const templateHtml = fs_1.default.readFileSync(templateHtmlPath, 'utf-8');
                const compiledTemplate = handlebars_1.default.compile(templateHtml);
                const htmlToSend = compiledTemplate(templateData);
                yield nodemailer_transporter_1.default.sendMail({
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
        });
    }
    static sendBookingConfirmationEmail(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const booking = yield prisma_client_1.default.booking.findUnique({
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
                    path: path_1.default.join(__dirname, '../../../lib/template/assets/guest-guidelines.pdf'),
                    contentType: 'application/pdf',
                },
            ];
            yield this.sendEmail(booking.email, `Your booking has been confirmed - ${templateData.order_id}`, 'confirmed.booking.html', templateData, attachment);
        });
    }
}
exports.SendConfirmationService = SendConfirmationService;
