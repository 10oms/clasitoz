const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  accessToken: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', TokenSchema);