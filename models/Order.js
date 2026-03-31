const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  stock: String,
  type: String,
  quantity: Number,
  price: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ ADD
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);