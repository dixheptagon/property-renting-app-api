import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const getPropertyReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get user from verifyToken middleware
    const userUid = req.user?.uid;

    if (!userUid) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not authenticated',
      );
    }

    // Find user by uid to get id and verify role
    const user = await database.user.findUnique({
      where: { uid: userUid },
      select: { id: true, role: true },
    });

    if (!user?.id) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User ID required',
      );
    }

    if (user.role !== 'tenant') {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Only tenants can access property reports',
      );
    }

    const tenantId = user.id;

    // Parse query parameters
    const { property_uid, room_type_uid, selected_date } = req.query;

    // Validate required parameters
    if (!property_uid || typeof property_uid !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Property UID is required and must be a string',
      );
    }

    if (!room_type_uid || typeof room_type_uid !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Room type UID is required and must be a string',
      );
    }

    if (!selected_date || typeof selected_date !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Selected date is required and must be a string (YYYY-MM-DD format)',
      );
    }

    // Validate selected_date format
    const selectedDate = new Date(selected_date as string);
    if (isNaN(selectedDate.getTime())) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid date format. Use YYYY-MM-DD',
      );
    }

    console.log('Property UID:', property_uid);
    console.log('Room Type UID:', room_type_uid || 'Not specified');
    console.log('Selected Date:', selectedDate.toISOString().split('T')[0]);

    // Find property by UID and verify ownership
    const property = await database.property.findUnique({
      where: { uid: property_uid },
      select: { id: true, user_id: true, status: true },
    });

    if (!property) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property not found',
      );
    }

    if (property.status !== 'active') {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property is not active',
      );
    }

    if (property.user_id !== tenantId) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Property does not belong to this tenant',
      );
    }

    const propertyId = property.id;

    // Build room filter
    let roomFilter: any = { property_id: propertyId };

    if (room_type_uid && typeof room_type_uid === 'string') {
      // Find room by UID and verify it belongs to the property
      const room = await database.room.findUnique({
        where: { uid: room_type_uid },
        select: { id: true, property_id: true },
      });

      if (!room) {
        throw new CustomError(
          HttpRes.status.NOT_FOUND,
          HttpRes.message.NOT_FOUND,
          'Room type not found',
        );
      }

      if (room.property_id !== propertyId) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Room type does not belong to the specified property',
        );
      }

      roomFilter.id = room.id;
    }

    // Get total units by summing total_units from matching rooms
    const roomsData = await database.room.findMany({
      where: roomFilter,
      select: { total_units: true },
    });

    const totalUnits = roomsData.reduce(
      (sum, room) => sum + room.total_units,
      0,
    );

    console.log('Total units:', totalUnits);

    if (totalUnits === 0) {
      // Return zero values if no units found
      const result = {
        booked_units: 0,
        available_units: 0,
        total_units: 0,
        occupancy_rate: 0,
        selected_date: selectedDate.toISOString().split('T')[0],
      };

      return res
        .status(HttpRes.status.OK)
        .json(
          ResponseHandler.success(
            'Property report retrieved successfully',
            result,
          ),
        );
    }

    // Get booked rooms count for the selected date
    // A room is booked if there's a booking where check_in <= selected_date < check_out
    // and the booking is not cancelled
    const bookedRoomsQuery = {
      where: {
        room: roomFilter,
        check_in_date: { lte: selectedDate },
        check_out_date: { gt: selectedDate },
        status: {
          in: [
            'pending_payment' as const,
            'processing' as const,
            'confirmed' as const,
            'completed' as const,
          ],
        },
      },
    };

    const bookedUnitsCount = await database.booking.count(bookedRoomsQuery);

    console.log('Booked units:', bookedUnitsCount);

    // Calculate metrics
    const availableUnits = totalUnits - bookedUnitsCount;
    const occupancyRate = Math.round((bookedUnitsCount / totalUnits) * 100);

    const result = {
      booked_units: bookedUnitsCount,
      available_units: availableUnits,
      total_units: totalUnits,
      occupancy_rate: occupancyRate,
      selected_date: selectedDate.toISOString().split('T')[0],
    };

    console.log('Final result:', result);

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Property report retrieved successfully',
          result,
        ),
      );
  } catch (error) {
    console.error('Error in getPropertyReportController:', error);
    next(error);
  }
};
