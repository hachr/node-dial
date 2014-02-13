var http = require('http');
var express = require('express');
var routes = require('../routes');
var utils = require('../utils');
var config = require('../../config.json');
var logger = utils.logger;

function Web(uuid) {

	var app = express();
	this.app = app;

	app.use(express.bodyParser());
	app.use(logAllRequests);

	app.all('*', allowCORS);

	//store the uuid so the routes can use.
	app.locals.uuid = uuid;

	//dial entry point
	app.get(config.dialPath, routes.dial.description);

	//TODO: [medium] (nhat) - how do we extend this to provide external logic?
	app.get(config.dialPath + ":appName", routes.dial.query);
	app.post(config.dialPath + ":appName", routes.dial.launch);
	app.del(config.dialPath + ":appName", routes.dial.terminate);

	this.server = http.createServer(app);
}

/**
 * provide a way of register external route to handle dial
 * {get:function}
 * @param {function} callback
 */
Web.prototype.registerRoutes = function (callback) {
	if (callback && typeof(callback) === "function") {
		callback.call(null, this.app); //it's pretty dangerous to expose the app... but for now it's okay...
	}
};

Web.prototype.start = function (port) {
	port = port || config.dialPort || 8001;
	this.server.listen(port);
	logger.info("Web started @ " + port);
};


function logAllRequests(req, res, next) {
	logger.debug("method", req.method, req.url, "with", req.body);
	next();
}

function allowCORS(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Credentials", true);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header("Access-Control-Allow-Headers", 'Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept');
	next();
}

module.exports = Web;