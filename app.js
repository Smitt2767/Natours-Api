const express = require('express');
const morgan = require('morgan');
// security
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();
const toursRouter = require('./routes/tours');
const usersRouter = require('./routes/users');
const reviewsRouter = require('./routes/reviews');
const globalErrorHandler = require('./controllers/error');
const AppError = require('./utils/appError');

// GLOBAL MIDDLEWARE
// Set Security Http headers
app.use(helmet());
// rate limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'to many request from this ip try again after an hour!',
});
app.use('/api', limiter);

// MIDDLEWARES
if (process.env.NODE_ENV === 'dev') app.use(morgan('dev'));

app.use(express.json({ limit: '10kb' }));

// DATA sanitization againts nosql query injection and also form cross site scripting
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl}...`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
