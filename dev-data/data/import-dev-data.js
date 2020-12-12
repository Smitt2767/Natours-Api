const mongoose = require('mongoose');

const fs = require('fs');
const Tour = require('../../model/tours');
const Review = require('../../model/reviews');
const User = require('../../model/users');
mongoose
  .connect('mongodb://127.0.0.1:27017/natours', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((con) => console.log('Database Connected'))
  .catch((err) => console.log('Database Connection failed'));

const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
const tours = JSON.parse(fs.readFileSync('tours.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('reviews.json', 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('success');
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Review.deleteMany();
    await Tour.deleteMany();
    await User.deleteMany();
    console.log('deleted');
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();
