import { Router } from 'express';
import { CreateReviewController } from './create-review/create.review.controller';
import { GetReviewsByPropertyController } from './get-reviews-by-property/get.review.by.property.controller';
import { GetMyReviewsController } from './get-my-reviews/get.my.reviews.controller';
import { ReplyReviewController } from './reply-review/reply.review.controller';
import { dummyUserMiddleware } from '../../lib/middlewares/dummy.verify.role';

const reviewRoute = Router();

// Apply dummy user middleware to all review routes
reviewRoute.use(dummyUserMiddleware as any);

// POST /api/review/:booking_uid/comment - Create a review for a booking
reviewRoute.post('/review/:booking_uid/comment', CreateReviewController as any);

// GET /api/review/my-reviews - Get reviews for authenticated guest
reviewRoute.get('/review/my-reviews', GetMyReviewsController as any);

// GET /api/review/:propertyId - Get reviews for a property (tenant dashboard)
reviewRoute.get('/review/:propertyId', GetReviewsByPropertyController);

// POST /api/review/:booking_uid/reply - Tenant reply to a review
reviewRoute.post('/review/:booking_uid/reply', ReplyReviewController as any);

export default reviewRoute;
