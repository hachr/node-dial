var winston = require('winston');
var json = require('../../package.json');
var config = require('../../config.json');

var name = json.name;
if (!winston.loggers[name]) {
	winston.loggers.add(name, {
		console: {
			colorize: 'true',
			level: (config.logLevel || 'info'),
			label: (name + "-" + json.version)
		}
//    file: {
//      filename: '/path/to/some/file'
//    }
	});
}
module.exports = winston.loggers.get(name);
