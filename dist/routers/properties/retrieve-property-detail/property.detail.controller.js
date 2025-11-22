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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyDetailsController = void 0;
const property_detail_service_1 = require("./property.detail.service");
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const getPropertyDetailsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract and validate parameters
        const { uid } = req.params;
        // Validate uid
        if (!uid || typeof uid !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Property uid is required and must be a string');
        }
        // Call service
        const propertyDetails = yield (0, property_detail_service_1.getPropertyDetails)(uid);
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Property details retrieved successfully', propertyDetails));
    }
    catch (error) {
        if (error instanceof Error && error.message === http_response_1.HttpRes.message.NOT_FOUND) {
            return next(new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found'));
        }
        // For other errors, pass to global error handler
        next(error);
    }
});
exports.getPropertyDetailsController = getPropertyDetailsController;
