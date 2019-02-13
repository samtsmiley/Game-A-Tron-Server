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
router.post('/', (req, res, next) => {
  const {description, gameId, value} = req.body;
  const userId = req.user.id;
  const newPost = {description, userId, gameId, value};
  if (!description) {
    const err = new Error('Missing `description` in request body');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    const err = new Error('The `gameId` is not valid');
    err.status = 400;
    return next(err);
  }
  if (value && !(typeof value === 'number' && isFinite(value))) {
    const err = new Error('The `value` field must be a Number');
    err.status = 400;
    return next(err);
  }

  Post.create(newPost)
    .then(result => res.location(`${req.originalUrl}/${result.id}`).sendStatus(201))
    .catch(err => next(err));
});
router.put('/:id', (req, res, next) => {});
router.delete('/:id', (req, res, next) => {});
