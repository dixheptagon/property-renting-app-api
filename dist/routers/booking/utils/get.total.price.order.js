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
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const http_response_1 = require("../../../lib/constant/http.response");
const custom_error_1 = require("../../../lib/utils/custom.error");
const GetTotalPriceOrder = (room_id, check_in_date, check_out_date) => __awaiter(void 0, void 0, void 0, function* () {
    // Parse dates to local timezone (Asia/Jakarta UTC+7)
    const localCheckIn = new Date(check_in_date.getTime() + 7 * 60 * 60 * 1000);
    const localCheckOut = new Date(check_out_date.getTime() + 7 * 60 * 60 * 1000);
    const room = yield prisma_client_1.default.room.findUnique({
        where: { id: room_id },
    });
    if (!room) {
        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Room not found');
    }
    const peakSeasons = yield prisma_client_1.default.peakSeasonRate.findMany({
        where: {
            OR: [{ room_id }, { property_id: room.property_id }],
            start_date: { lte: check_out_date },
            end_date: { gte: check_in_date },
        },
    });
    let totalPrice = 0;
    let currentDate = new Date(localCheckIn);
    const endDate = new Date(localCheckOut);
    while (currentDate < endDate) {
        const currentDateStr = currentDate.toISOString().split('T')[0];
        let price = room.base_price;
        // find season data that matches current date
        const season = peakSeasons.find((s) => currentDate >= s.start_date && currentDate <= s.end_date);
        if (season) {
            if (season.adjustment_type === 'nominal') {
                price = season.adjustment_value;
            }
            else if (season.adjustment_type === 'percentage') {
                const adjustment = room.base_price
                    .times(season.adjustment_value)
                    .div(100);
                price = room.base_price.plus(adjustment);
            }
        }
        const priceNumber = price.toNumber();
        totalPrice += priceNumber;
        // move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return totalPrice;
});
exports.default = GetTotalPriceOrder;
