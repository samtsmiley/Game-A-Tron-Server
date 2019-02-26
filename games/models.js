'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {type: String, required: true, unique: true},
  description: String,
  rules: [{description: {type: String, required: true}}],
  scores: [{description: {type: String, required: true}, points: Number}],
  endScore: {type: Number, default: null},
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
  participants: [{userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, score: {type: Number, default: 0}}],
  admins: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

schema.set('timestamps', true);
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = {Game: mongoose.model('Game', schema)};