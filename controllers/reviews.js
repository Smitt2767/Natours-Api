const Review = require('../model/reviews');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handler');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
