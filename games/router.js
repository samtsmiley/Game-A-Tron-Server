'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Game} = require('./models');

router.use('/', passport.authenticate('jwt', {session:false, failWithError: true}));

// get all games is a stretch goal

router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Game.findById(id).populate('posts')
    .then(result => {
      if (result) res.json(result);
      else next();
    }).catch(err => next(err));
});
