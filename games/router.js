'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Game} = require('./models');

router.use('/', passport.authenticate('jwt', {session:false, failWithError: true}));

// get all games 
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;

  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'name': re }, { 'description': re }];
  }


  Game
    .find(filter)
    // .populate('tags')
    .sort({ createdAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});




// get game by id
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
  const newGame = {name: name.trim(), admins: [userId]};
  // console.log('validated name and user');
  if (description) {
    if (typeof description !== 'string') {
      const err = new Error('The `description` property must be a String');
      err.status = 400;
      return next(err);
    }
    newGame.description = description;
  }
  // console.log('validated description');
  if (rules) {
    if (!Array.isArray(rules) || !rules.every(rule => {
      return (typeof rule === 'object' && rule.constructor === Object);
    })) {
      const err = new Error('The `rules` property must be an Array of Objects');
      err.status = 400;
      return next(err);
    }
    newGame.rules = rules;
  }
  // console.log('validated rules');
  if (scores) {
    // check we have the correct key/value pairs
    if (!Array.isArray(scores) || !scores.every(score => {
      // check if every rule is an Object that has the key 'description'
      if (!(typeof score === 'object' && score.constructor === Object)) return false;
      return score.hasOwnProperty('description');
    })) {
      const err = new Error('The `scores` property must be an Array of Objects with a key `description`');
      err.status = 400;
      return next(err);
    }
    // make sure there aren't any extra key/value pairs
    newGame.scores = scores.map(score => ({description: score.description, points: score.points}));
  }
  // console.log('validated scores');

  // TODO: add the game to the user who created it
  Game.find({name}).count()
    .then(count => {
      if (count > 0) return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: '`name` already taken',
        location: 'name'
      });
      return Game.create(newGame);
    }).then(result => res.location(`${req.originalUrl}/${result.id}`).sendStatus(201))
    // .then(result => res.location(`${req.originalUrl}/${result.id}`).status(201).json(result))
    .catch(err => {
      if (err.reason === 'ValidationError') return res.status(err.code).json(err);
      next(err);
    });
});

router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  const toUpdate = {};
  const updatableFields = ['name', 'description', 'rules', 'scores'];
  updatableFields.forEach(field => {
    if (field in req.body) toUpdate[field] = req.body[field];
  });
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (toUpdate.name) {
    if (typeof toUpdate.name !== 'string') {
      const err = new Error('The `name` property must be a String');
      err.status = 400;
      return next(err);
    }
    toUpdate.name = toUpdate.name.trim();
  }
  if (toUpdate.name === '') {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  if (toUpdate.description) {
    if (typeof toUpdate.description !== 'string') {
      const err = new Error('The `description` property must be a String');
      err.status = 400;
      return next(err);
    }
  }
  if (toUpdate.rules || toUpdate.rules === []) { // check if empty array because maybe user wants to remove all rules
    if (!Array.isArray(toUpdate.rules) || !toUpdate.rules.every(rule => {
      return typeof rule === 'string';
    })) {
      const err = new Error('The `rules` property must be an Array of Strings');
      err.status = 400;
      return next(err);
    }
  }
  if (toUpdate.scores || toUpdate.scores === []) { // check if empty array, same reason as above
    if (!Array.isArray(toUpdate.scores) || !toUpdate.scores.every(score => {
      if (!(typeof score === 'object' && score.constructor === Object)) return false;
      return score.hasOwnProperty('description');
    })) {
      const err = new Error('The `scores` property must be an Array of Objects with a key `description`');
      err.status = 400;
      return next(err);
    }
    toUpdate.scores = toUpdate.scores.map(score => ({description: score.description, points: score.points}));
  }

  Game.find({name: toUpdate.name}).count()
    .then(count => {
      if (count > 0) return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: '`name` already taken',
        location: 'name'
      });
      return Game.findOneAndUpdate({_id: id, admins: userId}, toUpdate, {new: true});
    }).then(result => {
      if (result) res.json(result);
      else next();
    }).catch(err => {
      if (err.reason === 'ValidationError') return res.status(err.code).json(err);
      next(err);
    });
});

// use this endpoint for updating the participants array (joining a game, leaving a game, updating scores)
router.put('/:id/participants', (req, res, next) => {
  const participants = req.body.participants;
  const id = req.params.id;
  const toUpdate = {participants};
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (!participants && participants !== []) {
    const err = new Error('Missing `participants` in request body');
    err.status = 400;
    return next(err);
  }
  if (!Array.isArray(participants) || !participants.every(participant => {
    if (!(typeof participant === 'object' && participant.constructor === Object)) return false;
    return participant.hasOwnProperty('userId');
  })) {
    const err = new Error('The `participants` property must be an Array of Objects with a key `userId`');
    err.status = 400;
    return next(err);
  }
  // get rid of any extra keys on participants
  toUpdate.participants = toUpdate.participants.map(participant => ({userId: participant.userId, score: participant.score}));

  Game.findByIdAndUpdate(id, toUpdate, {new: true})
    .then(result => {
      if (result) res.json(result);
      else next();
    }).catch(err => next(err));
});
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is invalid');
    err.status = 400;
    return next(err);
  }
  
  // TODO: remove the game from all participants
  Game.findOneAndRemove({_id: id, admins: userId})
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = {router};
