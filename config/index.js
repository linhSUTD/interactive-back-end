/**
 * Created by nguyenlinh on 7/17/17.
 */
module.exports.server = {

	PublicPort : 3000,

	WebUrl: "http://localhost:3000/",

	ResetPasswordUrl: 'http://localhost:3000/#!/resetPassword',

	EmailType: {
		AccountRegistration: 0,
		RequestResetPassword: 1,
		ResetPasswordSuccessfully: 2
	},

	EmailSender: {
		SenderEmail: "info@fundaml.com"
	}
}