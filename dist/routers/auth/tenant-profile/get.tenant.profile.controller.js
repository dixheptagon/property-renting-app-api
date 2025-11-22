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
exports.GetTenantProfileController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const response_handler_1 = require("../../../lib/utils/response.handler");
const http_response_1 = require("../../../lib/constant/http.response");
const GetTenantProfileController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res
                .status(http_response_1.HttpRes.status.UNAUTHORIZED)
                .json(response_handler_1.ResponseHandler.error('Unauthorized', 'User not authenticated'));
        }
        // Find User by UId
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: userId },
            select: {
                id: true,
                role: true,
            },
        });
        if (!user) {
            return res
                .status(http_response_1.HttpRes.status.OK)
                .json(response_handler_1.ResponseHandler.success('User not found', null));
        }
        const tenantProfile = yield prisma_client_1.default.tenantProfile.findUnique({
            where: {
                user_id: user.id,
            },
        });
        if (!tenantProfile) {
            return res
                .status(http_response_1.HttpRes.status.OK)
                .json(response_handler_1.ResponseHandler.success('Tenant profile not found', null));
        }
        // Response
        const response = {
            tenantProfile: {
                id: tenantProfile.id,
                user_id: tenantProfile.user_id,
                contact: tenantProfile.contact,
                address: tenantProfile.address,
                city: tenantProfile.city,
                country: tenantProfile.country,
                government_id_type: tenantProfile.government_id_type,
                government_id_path: tenantProfile.government_id_path,
                verified: tenantProfile.verified,
                created_at: tenantProfile.created_at,
                updated_at: tenantProfile.updated_at,
            },
            user: {
                id: user.id,
                role: user.role,
            },
        };
        return res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Tenant profile retrieved successfully', response));
    }
    catch (error) {
        next(error);
    }
});
exports.GetTenantProfileController = GetTenantProfileController;
