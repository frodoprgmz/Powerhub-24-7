const mongoose = require('mongoose');

const doorLogSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true }, // 'Sukces' or 'Błąd'
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = mongoose.model('DoorLog', doorLogSchema);
