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
router.post('/', (req, res, next) => {
  const {name, description, rules, scores} = req.body;
  const userId = req.user.id;
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  const newGame = {name};
  if (description) {
    if (typeof description !== 'string' || !(description instanceof String)) {
      const err = new Error('The `description` property must be a String');
      err.status = 400;
      return next(err);
    }
    newGame.description = description;
  }
  if (rules) {
    if (!Array.isArray(rules) || !rules.every(rule => {
      return typeof rule === 'string' || rule instanceof String;
    })) {
      const err = new Error('The `rules` property must be an Array of Strings');
      err.status = 400;
      return next(err);
    }
    newGame.rules = rules;
  }
  if (scores) {
    // check we have the correct key/value pairs
    if (!Array.isArray(scores) || !scores.every(score => {
      // check if every rule is an Object that has the key 'description'
      if (!(typeof rule === 'object' && score.constructor === Object)) return false;
      return score.hasOwnProperty('description');
    })) {
      const err = new Error('The `scores` property must be an Array of Objects with a key `description`');
      err.status = 400;
      return next(err);
    }
    // make sure there aren't any extra key/value pairs
    newGame.scores = scores.map(score => ({description: score.description, points: score.points}));
  }

  Game.create(newGame)
    .then(result => res.location(`${req.originalUrl}/${result.id}`).status(201))
    .catch(err => next(err));
});