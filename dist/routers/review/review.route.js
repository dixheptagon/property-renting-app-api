"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const create_review_controller_1 = require("./create-review/create.review.controller");
const get_my_reviews_controller_1 = require("./get-my-reviews/get.my.reviews.controller");
const get_awaiting_reviews_controller_1 = require("./get-awaiting-reviews/get.awaiting.reviews.controller");
const reply_review_controller_1 = require("./reply-review/reply.review.controller");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const verify_role_1 = require("../../lib/middlewares/verify.role");
const get_reviews_by_tenant_controller_1 = require("./get-reviews-by-tenant/get.reviews.by.tenant.controller");
const get_reviews_by_property_id_controller_1 = require("./get-reviews-by-property-id/get.reviews.by.property.id.controller");
const reviewRoute = (0, express_1.Router)();
// POST /api/review/:booking_uid/comment - Create a review for a booking (guests only)
reviewRoute.post('/review/:booking_uid/comment', verify_token_1.verifyToken, create_review_controller_1.CreateReviewController);
// GET /api/review/my-reviews - Get reviews for authenticated guest
reviewRoute.get('/review/my-reviews', verify_token_1.verifyToken, get_my_reviews_controller_1.GetMyReviewsController);
// GET /api/review/awaiting-reviews - Get awaiting reviews for authenticated guest
reviewRoute.get('/review/awaiting-reviews', verify_token_1.verifyToken, get_awaiting_reviews_controller_1.GetAwaitingReviewsController);
// GET /api/review/tenant - Get reviews by tenant (authenticated)
reviewRoute.get('/review/tenant', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_reviews_by_tenant_controller_1.GetReviewsByTenantController);
// GET /api/review/property/:property_uid - Get reviews by property ID (public)
reviewRoute.get('/review/property/:property_uid', get_reviews_by_property_id_controller_1.GetReviewsByPropertyIdController);
// POST /api/review/:booking_uid/reply - Tenant reply to a review
reviewRoute.post('/review/:booking_uid/reply', verify_token_1.verifyToken, verify_role_1.verifyTenant, reply_review_controller_1.ReplyReviewController);
exports.default = reviewRoute;
