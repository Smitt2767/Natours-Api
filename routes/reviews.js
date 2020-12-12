const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviews');
const { protect, restrictTo } = require('../controllers/auth');
router.use(protect);
router
  .route('/')
  .get(protect, getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);
router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .get(getReview);
module.exports = router;
