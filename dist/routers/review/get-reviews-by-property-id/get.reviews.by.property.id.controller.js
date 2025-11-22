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
exports.GetReviewsByPropertyIdController = void 0;
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const get_reviews_by_property_id_service_1 = require("./get.reviews.by.property.id.service");
const GetReviewsByPropertyIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { property_uid } = req.params;
        if (!property_uid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Property UID is required');
        }
        const { page = 1, limit = 5, rating, sort_by = 'created_at', sort_dir = 'desc', search, } = req.query;
        // Parse and validate pagination parameters
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid pagination parameters');
        }
        // Validate sort parameters
        const validSortBy = ['created_at', 'rating', 'updated_at'];
        const validSortDir = ['asc', 'desc'];
        if ((sort_by && !validSortBy.includes(sort_by)) ||
            (sort_dir && !validSortDir.includes(sort_dir))) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid sort parameters');
        }
        // Prepare service parameters
        const serviceParams = {
            page: pageNum,
            limit: limitNum,
            rating: rating,
            sort_by: sort_by,
            sort_dir: sort_dir,
            search: search,
        };
        // Get reviews with statistics
        const result = yield (0, get_reviews_by_property_id_service_1.getReviewsByPropertyId)(property_uid, serviceParams);
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Reviews retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
});
exports.GetReviewsByPropertyIdController = GetReviewsByPropertyIdController;
