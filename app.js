/**
 * Created by nguyenlinh on 7/16/17.
 */
/**
 * Module dependencies.
 */
var express       	= require('express');
var bodyParser    	= require('body-parser');
var logger        	= require('morgan');
var dotenv        	= require('dotenv');
var mongoose      	= require('mongoose');
var http			= require('http');
var jwt				= require('jsonwebtoken');

/**
 * Load environment variables from .env.development file, where API keys and passwords are configured.
 */
if (process.env.NODE_ENV === 'production') {
	dotenv.load({ path: '.env.production' });
} else {
	dotenv.load({ path: '.env.development' });
}


/**
 *	Connect database
 */
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', function (err) {
	console.error(err);
	console.log('MongoDB connection error. Please make sure MongoDB is running.');
	process.exit();
});

/**
 * Create Express server.
 */
var app = module.exports = express();

/**
 * Express configuration.
 */
var port = process.env.PORT || 5001;
app.set('superSecret', process.env.TOKEN_SECRET);

// Use morgan to log incoming requests
app.use(logger('dev'));

// Parse incoming requests to get information or parameters.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow query from other services
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Origin', "*");
	next();
});

//
http.ServerResponse.prototype.success = function (data) {

	data = data || {};

	data.success = true;

	this.json(data);
};

//Return 400 HTTP code with a error json message
http.ServerResponse.prototype.error = function (err, code) {

	this.status(400);

	this.json({ error: err.toString(), errorCode: code });
};


http.IncomingMessage.prototype.ensureParam = function (name, type, optional) {

	var val = this.params[name] || this.body[name] || this.query[name];

	if (!optional && (val === null || val === undefined || val === "")) {

		throw "Non-optional paramater '" + name + "' is missing";
	}

	if (type && val != null) {
		var t = type.toLowerCase();

		if (t == "array") {

			if (!Array.isArray(val)) {

				throw "Paramater '" + name + "' is expected to be of type Array";
			}

		} else if (typeof val != t) {

			throw "Parameter '" + name + "' is expected to be of type " + type;
		}
	}

	return val;
}

function isAuthenticated(req, res, next) {

	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if (token) {

		jwt.verify(token, app.get('superSecret'), function (err, decoded) {

			if (err) {

				return res.error("Failed to authenticate token.");

			} else {

				req.decoded = decoded;
				next();
			}
		})
	}
}

var userHandler = require('./handlers/userHandler');

var apiRoutes = express.Router();

apiRoutes.post('/login', userHandler.login);

apiRoutes.post('/register', userHandler.register);

apiRoutes.post('/forgotPassword', userHandler.forgotPassword);

apiRoutes.post('/resetPassword', userHandler.resetPassword);

app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);

console.log("Start the server at port " + port);