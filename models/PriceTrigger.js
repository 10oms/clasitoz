const mongoose = require('mongoose');

const PriceTriggerSchema = new mongoose.Schema({
  stock: String,
  targetPrice: Number,
  action: { type: String, default: "BUY" },
  quantity: { type: Number, default: 1 }, // ✅ ADD THIS
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('PriceTrigger', PriceTriggerSchema);