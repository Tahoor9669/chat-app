const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  roles: [{
    type: String,
    enum: ['user', 'channel_admin', 'group_admin', 'super_admin'],
    default: ['user']
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  profileImage: {
    type: String,
    default: 'default-avatar.png'
  }
});

module.exports = mongoose.model('User', userSchema);