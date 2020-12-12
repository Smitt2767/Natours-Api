const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./users');
// const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'tour name must be less then or equals 40 characters'],
      // validate: [validator.isAlpha, 'tour name must only contain characters'], // spaces also not a char
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      require: [true, 'A tour must have a group difiiculty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficuly is either : easy, medium, difficult ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 0'],
      max: [5, 'rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // WORKING ONLY WHEN WE save not work with update
        validator: function (val) {
          console.log(val, this.price);
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      require: [true, 'A tour must have a cover image'],
    },
    images: [String],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// DOCUMENT MIDDELWARE RUN BEFORE SAVE & CREATE | NOT FOR INSERTMANY
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guides = this.guides.map(async (id) => await await User.findById(id));
//   this.guides = await Promise.all(guides);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-createdAt -updatedAt -__v ',
  });
  next();
});
// tourSchema.post(/^find/, function (docs, next) {
//   console.log('query took : ', Date.now() - this.start, ' milliseconds...');
//   next();
// });
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
// tourSchema.pre('save', function (next) {
//   console.log('will save document...');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });
module.exports = mongoose.model('Tour', tourSchema);
