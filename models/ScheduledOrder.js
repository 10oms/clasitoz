const mongoose = require('mongoose');

const ScheduledOrderSchema = new mongoose.Schema({
  stock: String,
  scheduledTime: Date,
  action: { type: String, default: "BUY" },
  quantity: { type: Number, default: 1 }, // ✅ ADD THIS
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('ScheduledOrder', ScheduledOrderSchema);