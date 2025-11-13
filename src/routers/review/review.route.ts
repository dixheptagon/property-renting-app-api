import { Router } from 'express';
import { CreateReviewController } from './create-review/create.review.controller';
import { GetReviewsByPropertyController } from './get-reviews-by-property/get.review.by.property.controller';
import { GetMyReviewsController } from './get-my-reviews/get.my.reviews.controller';
import { GetAwaitingReviewsController } from './get-awaiting-reviews/get.awaiting.reviews.controller';
import { ReplyReviewController } from './reply-review/reply.review.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { verifyTenant, verifyGuest } from '../../lib/middlewares/verify.role';

const reviewRoute = Router();

// Apply authentication middleware to all review routes
reviewRoute.use(verifyToken);

// POST /api/review/:booking_uid/comment - Create a review for a booking (guests only)
reviewRoute.post('/review/:booking_uid/comment', CreateReviewController);

// GET /api/review/my-reviews - Get reviews for authenticated guest
reviewRoute.get('/review/my-reviews', GetMyReviewsController as any);

// GET /api/review/awaiting-reviews - Get awaiting reviews for authenticated guest
reviewRoute.get('/review/awaiting-reviews', GetAwaitingReviewsController);

// GET /api/review/:propertyId - Get reviews for a property (tenant dashboard)
reviewRoute.get(
  '/review/:propertyId',
  verifyTenant,
  GetReviewsByPropertyController,
);

// POST /api/review/:booking_uid/reply - Tenant reply to a review
reviewRoute.post(
  '/review/:booking_uid/reply',
  verifyTenant,
  ReplyReviewController as any,
);

export default reviewRoute;
