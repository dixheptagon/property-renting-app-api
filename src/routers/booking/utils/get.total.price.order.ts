import database from '../../../lib/config/prisma.client';
import { HttpRes } from '../../../lib/constant/http.response';
import { CustomError } from '../../../lib/utils/custom.error';

const GetTotalPriceOrder = async (
  room_id: number,
  check_in_date: Date,
  check_out_date: Date,
) => {
  const room = await database.room.findUnique({
    where: { id: room_id },
  });

  if (!room) {
    throw new CustomError(
      HttpRes.status.NOT_FOUND,
      HttpRes.message.NOT_FOUND,
      'Room not found',
    );
  }

  const peakSeasons = await database.peakSeasonRate.findMany({
    where: {
      OR: [{ room_id }, { property_id: room.property_id }],
      start_date: { lte: check_out_date },
      end_date: { gte: check_in_date },
    },
  });

  let totalPrice = 0;
  let currentDate = new Date(check_in_date);

  while (currentDate < new Date(check_out_date)) {
    let price = room.base_price;

    // find season data that matches current date
    const season = peakSeasons.find(
      (s) => currentDate >= s.start_date && currentDate <= s.end_date,
    );

    if (season) {
      if (season.adjustment_type === 'nominal') {
        price = season.adjustment_value;
      } else if (season.adjustment_type === 'percentage') {
        price = room.base_price.plus(
          room.base_price.times(season.adjustment_value).div(100),
        );
      }
    }

    totalPrice += price.toNumber();

    // move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalPrice;
};

export default GetTotalPriceOrder;
