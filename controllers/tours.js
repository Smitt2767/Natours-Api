const fs = require('fs');
const Tour = require('../model/tours');
const AppError = require('../utils/appError');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handler');
// ROUTE HANDLERS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};
exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { path: 'reviews' });
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);
exports.getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: -1 },
      },
      // {
      //   $match: { _id: { $eq: 'EASY' } },
      // },
    ]);
    res.json({
      status: 'success',
      reaquestedAt: req.requestTime,
      stats,
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};
exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.json({
      status: 'success',
      reaquestedAt: req.requestTime,
      plan,
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

exports.getToursWithin = async (req, res, next) => {
  // /tours-within/:distance/center/:latlang/unit/:unit
  try {
    const { distance, latlong, unit } = req.params;
    const [lat, long] = latlong.split(',');
    if (!lat || !long) {
      return next(new AppError('please provide latitude and longitude.', 400));
    }
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
    });
    res.json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (err) {
    next(new AppError(err, 500));
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlong, unit } = req.params;
    const [lat, long] = latlong.split(',');
    if (!lat || !long) {
      return next(new AppError('please provide latitude and longitude.', 400));
    }
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [+long, +lat],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (err) {
    next(new AppError(err, 500));
  }
};
