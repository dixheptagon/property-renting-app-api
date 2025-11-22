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
exports.AutoCompleteOrderController = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const AutoCompleteOrderController = () => {
    // Run daily at 00:00 server time to auto-complete orders where check-out date has passed 6 hours ago
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Calculate the date 6 hours ago
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            // Query bookings with status = confirmed and check_out_date < sixHoursAgo
            const bookingsToComplete = yield prisma_client_1.default.booking.findMany({
                where: {
                    status: 'confirmed',
                    check_out_date: {
                        lt: sixHoursAgo,
                    },
                },
            });
            // Update bookings to completed status
            const updatePromises = bookingsToComplete.map((booking) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield prisma_client_1.default.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'completed',
                        },
                    });
                }
                catch (error) {
                    console.error(`Failed to auto-complete booking ID: ${booking.id}, UID: ${booking.uid}`, error);
                }
            }));
            yield Promise.all(updatePromises);
        }
        catch (error) {
            console.error('Error in auto-complete order cron job:', error);
        }
    }));
};
exports.AutoCompleteOrderController = AutoCompleteOrderController;
