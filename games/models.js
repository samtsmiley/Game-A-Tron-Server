'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {type: String, required: true, unique: true},
  description: String,
  rules: [String],
  scores: [{description: {type: String, required: true}, points: Number}],
  endScore: {type: Number, default: null},
  posts: [{description: {type: String, required: true}, userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, value: Number}],
  participants: [{userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, score: Number, admin: Boolean}]
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
