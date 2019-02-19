'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Game} = require('./models');
const {User} = require('../users');

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

  Game.findById(id).populate('posts').populate('participants.userId', 'username')
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
  if (description) {
    if (typeof description !== 'string') {
      const err = new Error('The `description` property must be a String');
      err.status = 400;
      return next(err);
    }
    newGame.description = description;
  }
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

  // Do we want to add the user who created the game to the game's participants array?  What if someone just wants to run
  // a game and doesn't care to participate?  If we do add that, should it be done here or should we just call the join
  // endpoint after the game has been created?
  let result;
  Game.find({name}).count()
    .then(count => {
      if (count > 0) return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: '`name` already taken',
        location: 'name'
      });
      return Game.create(newGame); // can't use Promise.all because I need the game's id to add to the games array on the
      // user, this means that if there's an issue with updating the user, the game will be created but the user won't have
      // it on it's game array
    }).then(_result => {
      result = _result;
      return User.findOneAndUpdate({_id: userId}, {$push: {games: result.id}});
    }).then(() => res.location(`${req.originalUrl}/${result.id}`).status(201).json(result))
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

router.put('/join/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Game.find({_id: id, 'participants.userId': userId}).count()
    .then(count => {
      console.log(count);
      if (count > 0) return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: 'user is already a participant of game'
      });
      return User.findById(userId);
    }).then(result => {
      console.log(result);
      if (result.games.every(game => !game.equals(id))) return Promise.all([
        Game.findByIdAndUpdate(id, {$push: {participants: {userId}}}, {new: true}),
        User.findByIdAndUpdate(userId, {$push: {games: id}})
      ]);
      return Promise.all([
        Game.findByIdAndUpdate(id, {$push: {participants: {userId}}}, {new: true})
      ]);
    }).then(results => {
      if (results[0]) res.json(results[0]);
      else next();
    }).catch(err => {
      if (err.reason === 'ValidationError') return res.status(err.code).json(err);
      next(err);
    });
});
router.put('/leave/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Promise.all([
    User.findByIdAndUpdate(userId, {$pull: {games: id}}),
    Game.findByIdAndUpdate(id, {$pull: {participants: {userId}}}, {new: true})
  ]).then(results => {
    if (results[1]) res.json(results[1]);
    else next();
  }).catch(err => next(err));
});
router.put('/scores/:id', (req, res, next) => {
  const id = req.params.id;
  const {userId, score} = req.body; // userId is in req.body and not req.user because maybe another user is maintaining
  // the scores for the game?
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) { // validate userId here and not anywhere else because userId is from
    // res.body and not from res.user
    const err = new Error('The `userId` is not valid');
    err.status = 400;
    return next(err);
  }
  if (typeof score !== 'number' || !isFinite(score)) {
    const err = new Error('The `score` property must be a Number');
    err.status = 400;
    return next(err);
  }

  Game.findOneAndUpdate({_id: id, 'participants.userId': userId}, {'participants.$': {userId, score}}, {new: true})
    .then(result => {
      if (result) res.json(result);
      else return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: 'user is not a participant of the game',
        location: 'userId'
      });
    }).catch(err => {
      if (err.reason === 'ValidationError') return res.status(err.code).json(err); 
      next(err);
    });
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
    .then(() => User.updateMany({games: id}, {$pull: {games: id}}))
    .then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = {router};
