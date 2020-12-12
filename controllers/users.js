const AppError = require('../utils/appError');
const User = require('../model/users');
const { deleteOne, updateOne, getOne, getAll } = require('./handler');

const filterObj = (obj, ...allowdFields) => {
  let newObj = new Object();
  Object.keys(obj).forEach((el) => {
    if (allowdFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = getAll(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for upadte password!, please use /api/v1/users/updatePassword',
        400
      )
    );
  }
  try {
    const filterBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
      new: true,
      runValidators: true,
    });
    res.json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(new AppError('something went wrong!', 500));
  }
};
exports.getUser = getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'please use sign up',
  });
};
// Do not update password using this
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
