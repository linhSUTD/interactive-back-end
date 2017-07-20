/**
 * Created by nguyenlinh on 7/17/17.
 */
var fs 			= require('fs');
var config		= require('../config');

var Emails = {};

Emails[config.server.EmailType.AccountRegistration] = {

	title: 'Account Registration',

	html: fs.readFileSync('static/email_templates/email-account-registration.html').toString()
}

Emails[config.server.EmailType.RequestResetPassword] = {

	title: 'Request Reset Password',

	html: fs.readFileSync('static/email_templates/email-password-reset.html').toString()
}

Emails[config.server.EmailType.ResetPasswordSuccessfully] = {

	title: 'Reset Password Successfully',

	html: fs.readFileSync('static/email_templates/email-password-reset-successfully.html').toString()
}

module.exports = Emails;
