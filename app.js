//make sure we have config.json
try {
	require('./config.json');
} catch (e) {
	console.error("You need to have a config.json to start this service. Use config.json.tmpl as a template.");
	process.exit(1);
}

var dialServer = require('./lib/engine');

var os = require('os');
var infoHandler = function (req, res) {
	var memoryUsage = process.memoryUsage();
	var totalmem = os.totalmem();
	var freemem = os.freemem();
	var cpus = os.cpus();

	res.end(JSON.stringify({
		memoryUsage: memoryUsage,
		totalmem: totalmem,
		freemem: freemem,
		cpus: cpus
	}, null, 4));

};

//add some dynamic routes to illustrate the extending capability
dialServer.registerRoutes([
	{method: "get", path: "/sysinfo", handler: infoHandler}
]);


//start it
dialServer.start();