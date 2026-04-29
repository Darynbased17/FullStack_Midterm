const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerUsername: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);