var config = require('../config.json');

var services = require('./services/');
var SSDP = services.SSDP;
var Web = services.Web;

var utils = require('./utils');
var logger = utils.logger;
var uuid = utils.platform.uuid();

var web = new Web(uuid);
var ssdp = new SSDP({
	uuid: uuid,
	dialPort: config.dialPort,
	dialPath: config.dialPath
});

ssdp.addUSN('upnp:rootdevice');
ssdp.addUSN('urn:dial-multiscreen-org:service:dial:1');

module.exports = {
	/**
	 * List of routes. The route format is {method:get,path:'/blah',handler: function(req,res)}
	 * @param {Array} routes
	 */
	registerRoutes: function (routes) {
		web.registerRoutes(function (app) {
			for (var i = 0; i < routes.length; i++) {
				var route = routes[i];
				app[route.method.toLowerCase()].call(app, route.path, route.handler);
			}
		});
	},
	start: function () {
		ssdp.server();
		web.start();
	}
}