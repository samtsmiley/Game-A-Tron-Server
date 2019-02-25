'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Post} = require('./models');
const {Game} = require('../games');
// const {User} = require('../user');


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
  // const populateGame = {
  //   path: 'gameId',
  //   populate: {
  //     path: 'gameId',
  //     model: 'Game',
  //     select: 'name'
  //   }
  // };
  const populatePosts = {
    path: 'posts',
    populate: {
      path: 'userId',
      model: 'User',
      select: 'username'
    }
  };
  // Post.findOne({_id: id, userId}).populate(populateGame)
  // Post.findOne({_id: id, userId}).populate('gameId')
  Post.findOne({_id: id, userId}).populate({path: 'gameId', model:'Game', select: 'name'})

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
  // const populatePosts = {
  //   path: 'posts',
  //   populate: {
  //     path: 'userId',
  //     model: 'User',
  //     select: 'username'
  //   }
  // };
  const populatePosts = {
    path: 'posts',
    populate: {
      path: 'gameId',
      model: 'Game',
      select: 'name'
    }
  };
  Post.create(newPost)
    // .then(result => Game.findOneAndUpdate({_id: result.gameId}, {$push: {posts: result.id}},{new:true}).populate('admins').populate(populatePosts).populate({path: 'participants.userId', model:'User', select: 'username'}))  
    // .then(result => Game.findOneAndUpdate({_id: result.gameId}, {$push: {posts: result.id}},{new:true}).populate('admins').populate({path: 'posts.userId', model:'User', select: 'username'}).populate({path: 'participants.userId', model:'User', select: 'username'}))    
    .then(result => Game.findOneAndUpdate({_id: result.gameId}, {$push: {posts: result.id}},{new:true}).populate('admins posts').populate(populatePosts).populate({path: 'participants.userId', model:'User', select: 'username'}))    

    .then(result => res.location(`${req.originalUrl}/${result.id}`).status(201).json(result))
    .catch(err => next(err));
});


router.put('/:id', (req, res, next) => {
  // TODO: when a post has been edited, add a flag to mark that it isn't the original
  const id = req.params.id;
  const userId = req.user.id;
  const toUpdate = {};
  const updatableFields = ['description']; // I feel like this is the only reasonable thing to update
  updatableFields.forEach(field => {
    if (field in req.body) toUpdate[field] = req.body[field];
  });
  if (toUpdate.description === '') {
    const err = new Error('Missing `description` in request body');
    err.status = 400;
    return next(err);
  }
  if (toUpdate.description && typeof toUpdate.description !== 'string') {
    const err = new Error('The `description` field must be a String');
    err.status = 400;
    return next(err);
  }

  Post.findOneAndUpdate({_id: id, userId}, toUpdate, {new: true})
    .then(result => {
      if (result) res.json();
      else next();
    }).catch(err => next(err));
});
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Promise.all([
    Post.findByIdAndRemove({_id: id, userId}),
    Game.updateMany({posts: id}, {$pull: {posts: id}})
  ]).then(() => res.sendStatus(204))
    .catch(err => next(err));
});

module.exports = {router};
