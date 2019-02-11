'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
// const Game = require('../game');
// const {words} = require('../data/words');
//user.word.english

mongoose.Promise = global.Promise;

const UserSchema =  mongoose.Schema({
  username: {type: String, required: true,unique: true},
  password: {type: String, required: true},
  // firstName: {type: String, default: ''},
  // lastName: {type: String, default: ''},
  // games: [{gameId: mongoose.Types.Object.Id, ref: Game}]
});

UserSchema.methods.serialize = function() {
  return {
    username: this.username,
    // firstName: this.firstName || '',
    // lastName: this.lastName || '',
    id: this._id,
    games: this.games,

  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};
