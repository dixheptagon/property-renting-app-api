import { Router } from 'express';
import { CreateReviewController } from './create-review/create.review.controller';
import { GetMyReviewsController } from './get-my-reviews/get.my.reviews.controller';
import { GetAwaitingReviewsController } from './get-awaiting-reviews/get.awaiting.reviews.controller';
import { ReplyReviewController } from './reply-review/reply.review.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { verifyTenant, verifyGuest } from '../../lib/middlewares/verify.role';
import { GetReviewsByTenantController } from './get-reviews-by-tenant/get.reviews.by.tenant.controller';

const reviewRoute = Router();

// POST /api/review/:booking_uid/comment - Create a review for a booking (guests only)
reviewRoute.post(
  '/review/:booking_uid/comment',
  verifyToken,
  CreateReviewController,
);

// GET /api/review/my-reviews - Get reviews for authenticated guest
reviewRoute.get('/review/my-reviews', verifyToken, GetMyReviewsController);

// GET /api/review/awaiting-reviews - Get awaiting reviews for authenticated guest
reviewRoute.get(
  '/review/awaiting-reviews',
  verifyToken,
  GetAwaitingReviewsController,
);

// GET /api/review/:propertyId - Get reviews by property
reviewRoute.get(
  '/review/tenant',
  verifyToken,
  verifyTenant,
  GetReviewsByTenantController,
);

// POST /api/review/:booking_uid/reply - Tenant reply to a review
reviewRoute.post(
  '/review/:booking_uid/reply',
  verifyTenant,
  ReplyReviewController as any,
);

export default reviewRoute;
