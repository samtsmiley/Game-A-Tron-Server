'use strict';
const express = require('express');
const router = express.Router();
const {User} = require('../users');
const {sendEmail} = require('./send');
const {confirm} = require('./templates');

router.post('/', (req, res, next) => {
  const email = req.body.email;

  User.findOne({email})
    .then(user => {
      if (!user) {
        const err = new Error('There is no user with `email`');
        err.status = 400;
        return next(err);
      } else if (!user.confirmed) {
        sendEmail(user.email, confirm(user._id))
          .then(() => res.json({message: 'Email sent, please check your inbox to confirm'}));
      } else {
        res.json({message: 'Your email has already been confirmed'});
      }
    }).catch(err => next(err));
});