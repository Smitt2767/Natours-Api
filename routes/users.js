const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controllers/users');
const {
  signup,
  signin,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} = require('../controllers/auth');

// ROUTES

// AUTH
router.route('/signin').post(signin);
router.route('/signup').post(signup);
router.route('/forgotPassword').post(forgotPassword);
router.route('/updateMyPassword').patch(protect, updatePassword);
router.route('/resetPassword/:token').patch(resetPassword);

// USER
router.use(protect);
router.route('/updateMe').patch(updateMe);
router.route('/deleteMe').delete(deleteMe);
router.route('/me').get(getMe, getUser);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
