import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
export const getRoomTypesByPropertyIdController = async (req, res, next) => {
    try {
        // Extract and validate propertyUid from query parameters
        const { propertyUid } = req.query;
        // Validate propertyUid
        if (!propertyUid || typeof propertyUid !== 'string') {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Property UID is required and must be a string');
        }
        // Find property by UID to get the ID
        const property = await database.property.findUnique({
            where: { uid: propertyUid },
            select: { id: true, status: true },
        });
        if (!property) {
            throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Property not found');
        }
        if (property.status !== 'active') {
            throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Property is not active');
        }
        const propertyId = property.id;
        // Fetch room types for the property
        const rooms = await database.room.findMany({
            where: {
                property_id: propertyId,
            },
            select: {
                id: true,
                uid: true,
                name: true,
            },
            orderBy: {
                created_at: 'asc',
            },
        });
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Room types retrieved successfully', { rooms }));
    }
    catch (error) {
        console.error('Error in getRoomTypesByPropertyIdController:', error);
        next(error);
    }
};
