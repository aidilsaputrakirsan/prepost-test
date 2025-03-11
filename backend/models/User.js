const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  joinTime: { type: Date, default: Date.now },
  avatar: { type: String, default: "" },
  status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" }
});

module.exports = mongoose.model('User', UserSchema);
