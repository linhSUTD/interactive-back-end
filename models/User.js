/**
 * Created by nguyenlinh on 7/16/17.
 */
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({

	email: { type: String, unique: true },
	password: { type: String },
	passwordResetToken: { type: String },
	passwordResetExpires: { type: Date },
	role: { type: String, enum: ['Admin', 'Public'], default: 'Public' },
	status: { type: String, enum: ['active', 'suspended'], default: 'active' },
	salt: { type: String },

	given_name: { type: String },
	surname: { type: String },
	contact: { type: String },
	gender: { type: String },
	avatar: { type: String }
});

var User = mongoose.model('User', userSchema);

module.exports = User;