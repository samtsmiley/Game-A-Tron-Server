'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Post} = require('./models');

router.use('/', passport.authenticate('jwt', {session: false, failWithError: true}));

router.get('/', (req, res, next) => {
  // get all posts for a user
  const userId = req.query.userId;

  Post.find({userId}).sort({updatedAt: 'desc'})
    .then(results => res.json(results))
    .catch(err => next(err));
});
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Post.findOne({_id: id, userId})
    .then(result => {
      if (result) res.json(result);
      else next();
    }).catch(err => next(err));
});
router.post('/', (req, res, next) => {});
router.put('/:id', (req, res, next) => {});
router.delete('/:id', (req, res, next) => {});
