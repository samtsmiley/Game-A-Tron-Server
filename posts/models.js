'use strict';
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  description: {type: String, required: true},
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  gameId: {type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true},
  value: Number,
  comment: {type: String, required: false},
  image: {type: String, required: false},
  imageId: {type: String, required: false}
  // TODO: add a boolean for if a post has been edited
});

schema.set('timestamps', true);
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = {Post: mongoose.model('Post', schema)};
