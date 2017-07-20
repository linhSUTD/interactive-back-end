/**
 * Created by nguyenlinh on 7/16/17.
 */
var User 			= require('../models/User');
var app 			= require('../app');
var jwt				= require('jsonwebtoken');
var bluebird 		= require('bluebird');
var crypto 			= bluebird.promisifyAll(require('crypto'));
var emailHandler 	= require('./emailHandler').emailHandler;
var config			= require('../config');
var Q				= require("q");
var bcrypt			= require("bcrypt");

function generateSalt() {
	return Q.Promise(function(resolve, reject) {
		bcrypt.genSalt (10, function (err, salt) {
			if (err) {
				return reject(err);
			}
			return resolve(salt);
		})
	})
}

function hashPassword(password, salt) {
	return Q.Promise(function(resolve, reject) {
		bcrypt.hash (password, salt, function (err, hash) {
			if (err) {
				return reject(err);
			}
			return resolve(hash);
		})
	})
}

/**
 * POST /login
 * Sign in using email and password.
 */
exports.login = function(req, res, next) {

	try {
		var params = {
			email: req.ensureParam('email', 'string'),
			password: req.ensureParam('password', 'string')
		}
	} catch (e) {
		return res.error(e);
	}

	var getUser = function() {

		return User.findOne({email: params.email}).then(function(existingUser) {

			if (!existingUser) {
				throw new Error("Authentication failed. User not found.");
			}

			return existingUser;
		});
	}

	var loginUser = function(user) {

		return hashPassword(params.password, user.salt).then(function(hash) {

			if (user.password.trim() != hash.trim()) {
				throw new Error("Authentication failed. Wrong password.");
			}

			return jwt.sign(user, app.get('superSecret'), {
				expiresIn: 1440
			});
		})
	}

	getUser()
		.then(loginUser)
		.then(function(token) {
			return res.success(token);
		})
		.catch(function(err) {
			return res.error(err);
		})
}



/**
 * POST /reigster
 * Create a new local account.
 */
exports.register = function (req, res, next) {

	try {
		var params = {
			given_name: req.ensureParam('given_name', 'string'),
			sur_name: req.ensureParam('sur_name', 'string'),
			email: req.ensureParam('email', 'string'),
			password: req.ensureParam('password', 'string'),
			confirmPassword: req.ensureParam('confirmPassword', 'string')
		}
	} catch (e) {
		return res.error(e);
	}

	if (params.password.length < 8) {
		return res.error("Password must be at least 8 characters long");
	}

	if (params.password.trim() != params.confirmPassword.trim()) {
		return res.error("Passwords do not match");
	}

	var hash = function() {
		return generateSalt()
			.then(function(salt) {
				params.salt = salt;
				return hashPassword(params.password, salt);
			})
	}

	var createUser = function(hash) {

		var newUser = new User({
			email: params.email,
			password: hash,
			given_name: params.given_name,
			sur_name: params.sur_name,
			salt: params.salt
		})

		return User.findOne({email: params.email}).then(function(existingUser) {

			if (existingUser) {
				throw new Error("Account with that email address already exists.");
			}

			return newUser.save();
		});
	}

	hash()
		.then(createUser)
		.then(function(user) {

			var token = jwt.sign(user, app.get('superSecret'), {
				expiresIn: 1440
			});

			return res.success({
				token: token
			})
		})
		.catch(function(err) {
			return res.error(err);
		})
}

exports.forgotPassword = function (req, res, next) {

	try {

		var params = {

			email: req.ensureParam("email", "string")

		}

	} catch(e) {

		return res.error(e);

	}

	var createRandomToken = crypto.randomBytesAsync(16).then(function(buf) {
		return buf.toString('hex');
	});

	var setRandomToken = function(token) {

		return User.findOne({email: params.email}).then(function(existingUser) {

			if (!existingUser) {
				throw new Error("Account with that email address does not exist.")
			}

			existingUser.passwordResetToken = token;
			existingUser.passwordResetExpires = Date.now() + 86400 * 1000; // 24 hours
			existingUser.save();

			return existingUser;
		})
	}

	var sendForgotPasswordEmail = function(user) {

		if (!user) {
			throw new Error("Account does not exist.");
		}

		if (!user.passwordResetToken) {
			throw new Error("Reset token not found.");
		}

		var params = {
			user: user,
			url: config.server.ResetPasswordUrl + "?token=" + user.passwordResetToken
		}

		return emailHandler.sendTemplateEmail(config.server.EmailType.RequestResetPassword, params, []);
	}

	return createRandomToken
		.then(setRandomToken)
		.then(sendForgotPasswordEmail)
		.then(function() {
			return res.success("Success");
		})
		.catch(function(err) {
			return res.error(err);
		})
}

exports.resetPassword = function(req, res, next) {

	try {
		var params = {
			password: req.ensureParam('password', 'string'),
			confirmPassword: req.ensureParam('confirmPassword', 'string'),
			token: req.ensureParam('token', 'string')
		}
	} catch (e) {
		return res.error(e);
	}

	if (params.password.length < 8) {
		return res.error("Password must be at least 8 characters long");
	}

	if (params.password.trim() != params.confirmPassword.trim()) {
		return res.error("Passwords do not match");
	}

	var findUser = function() {

		return User.findOne({passwordResetToken: params.token})
			.where('passwordResetExpires').gt(Date.now()).then(function(existingUser) {

				if (!existingUser) {
					throw new Error("Password reset token is invalid or has expired.");
				}

				existingUser.passwordResetExpires = undefined;
				existingUser.passwordResetToken = undefined;
				return existingUser;
			})
	}

	var updatePassword = function(user) {

		return hashPassword(params.password, user.salt)
			.then(function(hash) {
				user.password = hash;
				user.save();
				return user;
		})
	}


	var sendEmail = function(user) {

		if (!user) {
			throw new Error("Account does not exist.");
		}

		var params = {
			user: user,
		}

		return emailHandler.sendTemplateEmail(config.server.EmailType.ResetPasswordSuccessfully, params, []);
	}

	findUser()
		.then(updatePassword)
		.then(sendEmail)
		.then(function() {
			return res.success("Success");
		})
		.catch(function(err) {
			return res.error(err);
		})
}