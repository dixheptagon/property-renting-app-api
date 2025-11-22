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
exports.movePropertyImagesController = void 0;
const move_property_image_service_1 = require("./move.property.image.service");
const response_handler_1 = require("../../../../lib/utils/response.handler");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const http_response_1 = require("../../../../lib/constant/http.response");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const movePropertyImagesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get propertyId from request params
        const { propertyId } = req.params;
        if (!propertyId || isNaN(Number(propertyId))) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Valid propertyId is required');
        }
        // Get tenant ID from middleware
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!tenantId) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Tenant not authenticated');
        }
        // Find User by UId
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: tenantId },
        });
        // Verify that the property belongs to the tenant
        const property = yield prisma_client_1.default.property.findFirst({
            where: {
                id: Number(propertyId),
                user_id: user === null || user === void 0 ? void 0 : user.id,
            },
        });
        if (!property) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found or does not belong to tenant');
        }
        // Call service to move images
        const result = yield (0, move_property_image_service_1.movePropertyImagesService)(Number(propertyId));
        // Send success response
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.OK, result));
    }
    catch (error) {
        next(error);
    }
});
exports.movePropertyImagesController = movePropertyImagesController;
