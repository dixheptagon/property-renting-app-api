import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Load and seed users
    const usersData = JSON.parse(
      fs.readFileSync('prisma/seed-data/user.json', 'utf-8'),
    );
    const userMap = new Map<string, number>();

    for (const userData of usersData) {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await prisma.user.create({ data: userData });
      userMap.set(user.uid, user.id);
      console.log(`Created user: ${user.id}`);
    }

    // Seed tenant profiles
    const tenantProfilesData = JSON.parse(
      fs.readFileSync('prisma/seed-data/tenant_profile.json', 'utf-8'),
    );
    for (const profileData of tenantProfilesData) {
      const userId = userMap.get(profileData.tenant_uid);
      if (!userId)
        throw new Error(`User not found for ${profileData.tenant_uid}`);
      await prisma.tenantProfile.create({
        data: {
          user_id: userId,
          balance: profileData.balance,
          contact: profileData.contact,
          government_id_type: profileData.government_id_type,
          government_id_path: profileData.government_id_path,
          address: profileData.address,
          city: profileData.city,
          country: profileData.country,
          verified: profileData.verified,
        },
      });
      console.log(`Created tenant profile for user: ${userId}`);
    }

    // Seed properties
    const propertiesData = JSON.parse(
      fs.readFileSync('prisma/seed-data/property.json', 'utf-8'),
    );
    const propertyMap = new Map<string, number>();

    for (const propertyData of propertiesData) {
      const userId = userMap.get(propertyData.tenant_uid);
      if (!userId)
        throw new Error(`User not found for ${propertyData.tenant_uid}`);
      const property = await prisma.property.create({
        data: {
          uid: propertyData.uid,
          user_id: userId,
          category: propertyData.category,
          title: propertyData.title,
          description: propertyData.description,
          address: propertyData.address,
          city: propertyData.city,
          country: propertyData.country,
          postal_code: propertyData.postal_code,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          place_id: propertyData.place_id,
          map_url: propertyData.map_url,
          amenities: propertyData.amenities,
          rules: propertyData.rules,
          base_price: propertyData.base_price,
          status: propertyData.status,
        },
      });
      propertyMap.set(property.uid, property.id);
      console.log(`Created property: ${property.id}`);
    }

    // Seed rooms
    const roomsData = JSON.parse(
      fs.readFileSync('prisma/seed-data/room.json', 'utf-8'),
    );
    const roomMap = new Map<string, number>();

    for (const roomData of roomsData) {
      const propertyId = propertyMap.get(roomData.property_uid);
      if (!propertyId)
        throw new Error(`Property not found for ${roomData.property_uid}`);
      const room = await prisma.room.create({
        data: {
          uid: roomData.uid,
          property_id: propertyId,
          name: roomData.name,
          description: roomData.description,
          base_price: roomData.base_price,
          max_guest: roomData.max_guest,
          bedrooms: roomData.bedrooms,
          bathrooms: roomData.bathrooms,
          beds: roomData.beds,
          highlight: roomData.highlight,
          total_units: roomData.total_units,
        },
      });
      roomMap.set(room.uid, room.id);
      console.log(`Created room: ${room.id}`);
    }

    // Seed bookings
    const bookingsData = JSON.parse(
      fs.readFileSync('prisma/seed-data/booking.json', 'utf-8'),
    );
    const bookingMap = new Map<string, number>();

    for (const bookingData of bookingsData) {
      const userId = userMap.get(bookingData.user_uid);
      const roomId = roomMap.get(bookingData.room_uid);
      const propertyId = propertyMap.get(bookingData.property_uid);
      if (!userId || !roomId || !propertyId)
        throw new Error('Missing IDs for booking');
      const booking = await prisma.booking.create({
        data: {
          uid: bookingData.uid,
          user_id: userId,
          room_id: roomId,
          property_id: propertyId,
          check_in_date: new Date(bookingData.check_in_date),
          check_out_date: new Date(bookingData.check_out_date),
          fullname: bookingData.fullname,
          email: bookingData.email,
          phone_number: bookingData.phone_number,
          total_price: bookingData.total_price,
          status: bookingData.status,
          payment_method: bookingData.payment_method,
          payment_proof: bookingData.payment_proof,
          transaction_id: bookingData.transaction_id,
          payment_deadline: new Date(bookingData.payment_deadline),
          paid_at: new Date(bookingData.paid_at),
        },
      });
      bookingMap.set(booking.uid!, booking.id);
      console.log(`Created booking: ${booking.id}`);
    }

    // Seed room unavailabilities
    const unavailabilitiesData = JSON.parse(
      fs.readFileSync('prisma/seed-data/room_unavailability.json', 'utf-8'),
    );
    for (const unavData of unavailabilitiesData) {
      const propertyId = propertyMap.get(unavData.property_uid);
      const roomId = roomMap.get(unavData.room_uid);
      if (!propertyId || !roomId)
        throw new Error('Missing IDs for unavailability');
      const unav = await prisma.roomUnavailability.create({
        data: {
          property_id: propertyId,
          room_id: roomId,
          start_date: new Date(unavData.start_date),
          end_date: new Date(unavData.end_date),
          reason: unavData.reason,
        },
      });
      console.log(`Created room unavailability: ${unav.id}`);
    }

    // Seed peak season rates
    const peakRatesData = JSON.parse(
      fs.readFileSync('prisma/seed-data/peak_season_rate.json', 'utf-8'),
    );
    for (const rateData of peakRatesData) {
      const propertyId = propertyMap.get(rateData.property_uid);
      const roomId = rateData.room_uid ? roomMap.get(rateData.room_uid) : null;
      if (!propertyId) throw new Error('Missing property ID for peak rate');
      await prisma.peakSeasonRate.create({
        data: {
          property_id: propertyId,
          room_id: roomId,
          start_date: new Date(rateData.start_date),
          end_date: new Date(rateData.end_date),
          adjustment_type: rateData.adjustment_type,
          adjustment_value: rateData.adjustment_value,
        },
      });
      console.log(`Created peak season rate for property: ${propertyId}`);
    }

    // Seed reviews
    const reviewsData = JSON.parse(
      fs.readFileSync('prisma/seed-data/review.json', 'utf-8'),
    );
    for (const reviewData of reviewsData) {
      const bookingId = bookingMap.get(reviewData.booking_uid);
      const userId = userMap.get(reviewData.user_uid);
      const propertyId = propertyMap.get(reviewData.property_uid);
      if (!bookingId || !userId || !propertyId)
        throw new Error('Missing IDs for review');
      const review = await prisma.review.create({
        data: {
          booking_id: bookingId,
          user_id: userId,
          property_id: propertyId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          is_public: reviewData.is_public,
        },
      });
      console.log(`Created review: ${review.id}`);
    }

    // Seed wishlists
    const wishlistsData = JSON.parse(
      fs.readFileSync('prisma/seed-data/wishlist.json', 'utf-8'),
    );
    for (const wishlistData of wishlistsData) {
      const userId = userMap.get(wishlistData.user_uid);
      const propertyId = propertyMap.get(wishlistData.property_uid);
      if (!userId || !propertyId) throw new Error('Missing IDs for wishlist');
      const wishlist = await prisma.wishlist.create({
        data: {
          user_id: userId,
          property_id: propertyId,
        },
      });
      console.log(`Created wishlist: ${wishlist.id}`);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
