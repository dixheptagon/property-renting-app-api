import database from '../../../lib/config/prisma.client.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
const GetTotalPriceOrder = async (room_id, check_in_date, check_out_date) => {
    // Parse dates to local timezone (Asia/Jakarta UTC+7)
    const localCheckIn = new Date(check_in_date.getTime() + 7 * 60 * 60 * 1000);
    const localCheckOut = new Date(check_out_date.getTime() + 7 * 60 * 60 * 1000);
    const room = await database.room.findUnique({
        where: { id: room_id },
    });
    if (!room) {
        throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Room not found');
    }
    const peakSeasons = await database.peakSeasonRate.findMany({
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
};
export default GetTotalPriceOrder;
