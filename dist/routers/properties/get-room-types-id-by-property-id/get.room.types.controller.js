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
exports.getRoomTypesByPropertyIdController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const getRoomTypesByPropertyIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract and validate propertyUid from query parameters
        const { propertyUid } = req.query;
        // Validate propertyUid
        if (!propertyUid || typeof propertyUid !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Property UID is required and must be a string');
        }
        // Find property by UID to get the ID
        const property = yield prisma_client_1.default.property.findUnique({
            where: { uid: propertyUid },
            select: { id: true, status: true },
        });
        if (!property) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found');
        }
        if (property.status !== 'active') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property is not active');
        }
        const propertyId = property.id;
        // Fetch room types for the property
        const rooms = yield prisma_client_1.default.room.findMany({
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
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Room types retrieved successfully', { rooms }));
    }
    catch (error) {
        console.error('Error in getRoomTypesByPropertyIdController:', error);
        next(error);
    }
});
exports.getRoomTypesByPropertyIdController = getRoomTypesByPropertyIdController;
