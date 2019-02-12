'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const schema = new mongoose.Schema({
  username: {type: String, required: true,unique: true},
  password: {type: String, required: true},
  games: [{gameId: mongoose.Types.Object.Id, ref: 'Game'}]
});

schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
    delete result.password;
  }
});

schema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

schema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', schema);

module.exports = {User};
