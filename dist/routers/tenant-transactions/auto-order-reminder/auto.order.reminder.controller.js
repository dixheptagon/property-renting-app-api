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
exports.AutoOrderReminderController = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const send_reminder_service_1 = require("./send.reminder.service");
const AutoOrderReminderController = () => {
    // Run daily at 00:00 server time to send reminder emails for tomorrow's check-ins
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Calculate tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
            // Query bookings with check_in_date = tomorrow and status in ['confirmed', 'processing']
            const bookings = yield prisma_client_1.default.booking.findMany({
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
            const emailPromises = bookings.map((booking) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield send_reminder_service_1.SendReminderService.sendBookingReminderEmail(booking.id);
                }
                catch (error) {
                    console.error(`Failed to send reminder email for booking ID: ${booking.id}`, error);
                }
            }));
            yield Promise.all(emailPromises);
        }
        catch (error) {
            console.error('Error in auto order reminder cron job:', error);
        }
    }));
};
exports.AutoOrderReminderController = AutoOrderReminderController;
