/**
 * Created by nguyenlinh on 7/17/17.
 */
var config 			= require('../config');
var Emails 			= require('../models/Emails');
var Q				= require('q');
var nodemailer		= require('nodemailer');

var emailHandler = {

	createEmailFromTemplate: function(template, params) {

		var email = {
			title: template.title,
			html: template.html
		}

		if (params.user) {
			email.html = email.html
				.replace(/\[NAME\]/g, 		params.user.given_name)
				.replace(/\[EMAIL\]/g, 		params.user.email)
		}

		if (params.url) {
			email.html = email.html
				.replace(/\[URL\]/g, 	params.url);
		}

		email.html = email.html.replace(/\[CONTACT_EMAIL\]/g,	    config.server.EmailSender.SenderEmail);
		email.html = email.html.replace(/\[SENDER_HOME_URL\]/g,	    config.server.WebUrl);

		return email;
	},

	sendEmail: function(email, params, attachments) {

		var message = {
			to: params.user.email,
			from: config.server.EmailSender.SenderEmail,
			subject: email.title,
			html: email.html,
			attachments: attachments
		}

		var transporter = nodemailer.createTransport({
			service: 'SendGrid',
			auth: {
				user: process.env.SENDGRID_USER,
				pass: process.env.SENDGRID_PASSWORD
			}
		})

		return transporter.sendMail(message);
	},

	sendTemplateEmail: function(type, params, attachments) {

		var template = Emails[type];

		if (!template) {
			return Q.reject("Invalid email template type: " + type);
		}

		var email = this.createEmailFromTemplate(template, params);

		return this.sendEmail(email, params, attachments);
	}
}

exports.emailHandler = emailHandler;

