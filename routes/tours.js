const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../controllers/auth');
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tours');

const reviewRouter = require('./reviews');
// const { createReview } = require('../controllers/reviews');

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlong/unit/:unit')
  .get(getToursWithin);
router.route('/distances/:latlong/unit/:unit').get(getDistances);

router.route('/tour-stats').get(getTourStats);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

module.exports = router;
