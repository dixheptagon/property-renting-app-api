import database from '../../../lib/config/prisma.client';
import { HttpRes } from '../../../lib/constant/http.response';
import { CustomError } from '../../../lib/utils/custom.error';

const GetTotalPriceOrder = async (
  room_id: number,
  check_in_date: Date,
  check_out_date: Date,
) => {
  // Parse dates to local timezone (Asia/Jakarta UTC+7)
  const localCheckIn = new Date(check_in_date.getTime() + 7 * 60 * 60 * 1000);
  const localCheckOut = new Date(check_out_date.getTime() + 7 * 60 * 60 * 1000);

  console.log('🔍 GetTotalPriceOrder called with:', {
    room_id,
    check_in_date: localCheckIn.toISOString().split('T')[0],
    check_out_date: localCheckOut.toISOString().split('T')[0],
    original_check_in: check_in_date.toISOString(),
    original_check_out: check_out_date.toISOString(),
  });

  const room = await database.room.findUnique({
    where: { id: room_id },
  });

  console.log('🏠 Room data:', {
    room_id,
    found: !!room,
    base_price: room?.base_price?.toString(),
    property_id: room?.property_id,
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

  console.log(
    '📊 Peak season rates found:',
    peakSeasons.map((season) => ({
      id: season.id,
      room_id: season.room_id,
      property_id: season.property_id,
      start_date: season.start_date.toISOString().split('T')[0],
      end_date: season.end_date.toISOString().split('T')[0],
      adjustment_type: season.adjustment_type,
      adjustment_value: season.adjustment_value.toString(),
    })),
  );

  let totalPrice = 0;
  let currentDate = new Date(localCheckIn);
  const endDate = new Date(localCheckOut);

  console.log('📅 Starting price calculation loop:');
  console.log('   From:', currentDate.toISOString().split('T')[0]);
  console.log('   To:', endDate.toISOString().split('T')[0]);

  while (currentDate < endDate) {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    let price = room.base_price;

    console.log(`   Day ${currentDateStr}: Base price = ${price.toString()}`);

    // find season data that matches current date
    const season = peakSeasons.find(
      (s) => currentDate >= s.start_date && currentDate <= s.end_date,
    );

    if (season) {
      console.log(`   Found matching season (ID: ${season.id}):`, {
        adjustment_type: season.adjustment_type,
        adjustment_value: season.adjustment_value.toString(),
      });

      if (season.adjustment_type === 'nominal') {
        price = season.adjustment_value;
        console.log(`   Using nominal price: ${price.toString()}`);
      } else if (season.adjustment_type === 'percentage') {
        const adjustment = room.base_price
          .times(season.adjustment_value)
          .div(100);
        price = room.base_price.plus(adjustment);
        console.log(
          `   Using percentage adjustment: ${adjustment.toString()} (${season.adjustment_value.toString()}%)`,
        );
        console.log(`   Final price: ${price.toString()}`);
      }
    } else {
      console.log(
        `   No season adjustment found, using base price: ${price.toString()}`,
      );
    }

    const priceNumber = price.toNumber();
    totalPrice += priceNumber;
    console.log(
      `   Added ${priceNumber} to total. Running total: ${totalPrice}`,
    );

    // move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('💰 Final total price:', totalPrice);
  return totalPrice;
};

export default GetTotalPriceOrder;
