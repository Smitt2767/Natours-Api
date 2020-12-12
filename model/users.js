const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name must be required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email must be required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'please provide a valid email'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      require: [true, 'password must be required'],
      select: false,
      minlength: [6, 'password must 6 or more char. long'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'please confirm your password'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },

        message: 'Passwords are not same',
      },
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'guide', 'lead-guide', 'admin'],
        message: 'role is either : user, guide, lead-guid, admin',
      },
      default: 'user',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.methods.correctPassword = async (candidatePass, userPass) => {
  return await bcrypt.compare(candidatePass, userPass);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Store this in database for security

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
  }
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

module.exports = mongoose.model('User', userSchema);
