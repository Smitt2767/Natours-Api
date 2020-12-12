const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found!', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};
exports.updateOne = (Model) => async (req, res, next) => {
  const id = req.params.id;
  try {
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!doc) {
      next(new AppError('No document found with that ID', 404));
    }
    res.json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};
exports.getOne = (Model, populateOptions) => async (req, res, next) => {
  const id = req.params.id;
  try {
    let query = Model.findById(id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc)
      return next(new AppError(`No documents found! with id ${id}`, 404));
    res.json({
      status: 'success',
      reaquestedAt: req.requestTime,
      data: {
        data: doc,
      },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};
exports.getAll = (Model) => async (req, res, next) => {
  try {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();
    res.json({
      status: 'success',
      reaquestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};
