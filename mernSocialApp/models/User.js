const {model, Schema} = require('mongoose');
const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String,
  followings:[String],
  followers:[String]
});
module.exports = model('User', userSchema);
