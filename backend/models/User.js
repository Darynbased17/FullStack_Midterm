const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 10000 },
  // { ticker: "XYZ", shares: 10 }
  portfolio: [
    {
      ticker: String,
      shares: Number,
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);