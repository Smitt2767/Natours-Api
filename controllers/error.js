module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'dev') {
    //   Development error
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      if (err.errorData.kind === 'ObjectId') {
        err.message = `Invalid ${err.errorData.path} : ${err.errorData.value}`;
      } else if (err.errorData.code === 11000) {
        if (err.errorData.keyValue.name) {
          err.message = `tour with < ${err.errorData.keyValue.name} > is already exist change tour name to continue`;
        } else {
          err.message = 'user has already review for this tour!';
        }
      } else if (err.errorData.name === 'ValidatorError') {
        err.message = err.errorData.message;
      } else if (
        err.errorData.name === 'JsonWebTokenError' ||
        err.errorData.name === 'TokenExpiredError'
      ) {
        err.message = `${err.errorData.message}! login again to continue`;
      } else {
        err.message = err.errorData;
      }
      //   Production error
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('ERROR : ', err);

      res.status(500).json({
        status: 'error',
        message: 'something went wrong!',
      });
    }
  }
};
