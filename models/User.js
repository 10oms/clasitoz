const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: { type: Number, default: 100000 },
  portfolio: [],
  watchlist: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);