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
exports.AutoCancelOrder = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const AutoCancelOrder = () => {
    // Run every hour to auto-cancel pending payments after 2 hours
    node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const now = new Date();
            const result = yield prisma_client_1.default.booking.updateMany({
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
                console.log(`Auto-cancelled ${result.count} pending bookings at ${now.toISOString()}`);
            }
        }
        catch (error) {
            console.error('Error in auto-cancel cron job:', error);
        }
    }));
};
exports.AutoCancelOrder = AutoCancelOrder;
