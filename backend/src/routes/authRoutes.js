'use strict';
const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidator');

router.post('/login', loginValidator, validate, authCtrl.login);
router.post('/register', registerValidator, validate, authCtrl.register);
router.post('/forgot-password', forgotPasswordValidator, validate, authCtrl.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authCtrl.resetPassword);

module.exports = router;
