const jwt = require('jsonwebtoken');
const User = require('../model/users');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_IN,
  });
};
const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV !== 'dev') cookieOptions.secret = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  user.passwordChangedAt = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createAndSendToken(newUser, 201, res);
  } catch (err) {
    next(new AppError(err, 400));
  }
};
exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('email & password required', 400));
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('invalid email or password', 401));
    }
    createAndSendToken(user, 200, res);
  } catch (err) {
    next(new AppError(err, 500));
  }
};
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.replace('Bearer ', '');
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! pleas e login to continue', 401)
    );
  }
  try {
    //   Varify token
    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    // check user exist
    const currentUser = await User.findById(decode.id);
    if (!currentUser) {
      return next(
        new AppError('the user belongs to this token is no longer exists', 401)
      );
    }
    // check user does not changed password
    if (currentUser.changePasswordAfter(decode.iat)) {
      return next(
        new AppError(
          'User recently changed password! please login again to continue',
          401
        )
      );
    }
    req.user = currentUser;
  } catch (err) {
    return next(new AppError(err, 401));
  }
  // req.user = currentUser;
  next();
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide'], role = 'user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
exports.forgotPassword = async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return next(new AppError('email must be required', 400));
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new AppError('there is no user with that email address', 404)
      );
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password! submit a patch request with your new password and confirm password to : ${resetURL}\nIf you didn't forgot your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'your password reset token. (valid for 10 mins.)',
        message,
      });
      return res.json({
        status: 'success',
        message: `link  sent to email! ${user.email}`,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(err);
      return next(new AppError('there was an error to send an email!', 500));
    }
  } catch (err) {
    next(new AppError(err, 400));
  }
};
exports.resetPassword = async (req, res, next) => {
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  if (!password || !passwordConfirm) {
    return next(
      new AppError('all fields are required to update your password!', 400)
    );
  }
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return next(new AppError('invalid token or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;

    await user.save();
    createAndSendToken(user, 200, res);
  } catch (err) {
    next(new AppError(err, 400));
  }
};
exports.updatePassword = async (req, res, next) => {
  const oldPassword = req.body.oldPassword;
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  if (!oldPassword || !password || !passwordConfirm) {
    return next(
      new AppError('all fields are required to update your password!', 400)
    );
  }

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.correctPassword(oldPassword, user.password))) {
      return next(new AppError('Inavlid old password!', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createAndSendToken(user, 200, res);
  } catch (err) {
    next(new AppError(err, 400));
  }
};
