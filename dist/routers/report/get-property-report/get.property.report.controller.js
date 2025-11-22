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
exports.getPropertyReportController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const getPropertyReportController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user from verifyToken middleware
        const userUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userUid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Find user by uid to get id and verify role
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: userUid },
            select: { id: true, role: true },
        });
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User ID required');
        }
        if (user.role !== 'tenant') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'Only tenants can access property reports');
        }
        const tenantId = user.id;
        // Parse query parameters
        const { property_uid, room_type_uid, selected_date } = req.query;
        // Validate required parameters
        if (!property_uid || typeof property_uid !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Property UID is required and must be a string');
        }
        if (!room_type_uid || typeof room_type_uid !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Room type UID is required and must be a string');
        }
        if (!selected_date || typeof selected_date !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Selected date is required and must be a string (YYYY-MM-DD format)');
        }
        // Validate selected_date format
        const selectedDate = new Date(selected_date);
        if (isNaN(selectedDate.getTime())) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
        }
        // Find property by UID and verify ownership
        const property = yield prisma_client_1.default.property.findUnique({
            where: { uid: property_uid },
            select: { id: true, user_id: true, status: true },
        });
        if (!property) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found');
        }
        if (property.status !== 'active') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property is not active');
        }
        if (property.user_id !== tenantId) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'Property does not belong to this tenant');
        }
        const propertyId = property.id;
        // Build room filter
        let roomFilter = { property_id: propertyId };
        if (room_type_uid && typeof room_type_uid === 'string') {
            // Find room by UID and verify it belongs to the property
            const room = yield prisma_client_1.default.room.findUnique({
                where: { uid: room_type_uid },
                select: { id: true, property_id: true },
            });
            if (!room) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Room type not found');
            }
            if (room.property_id !== propertyId) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Room type does not belong to the specified property');
            }
            roomFilter.id = room.id;
        }
        // Get total units by summing total_units from matching rooms
        const roomsData = yield prisma_client_1.default.room.findMany({
            where: roomFilter,
            select: { total_units: true },
        });
        const totalUnits = roomsData.reduce((sum, room) => sum + room.total_units, 0);
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
                .status(http_response_1.HttpRes.status.OK)
                .json(response_handler_1.ResponseHandler.success('Property report retrieved successfully', result));
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
                        'pending_payment',
                        'processing',
                        'confirmed',
                        'completed',
                    ],
                },
            },
        };
        const bookedUnitsCount = yield prisma_client_1.default.booking.count(bookedRoomsQuery);
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
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Property report retrieved successfully', result));
    }
    catch (error) {
        console.error('Error in getPropertyReportController:', error);
        next(error);
    }
});
exports.getPropertyReportController = getPropertyReportController;
