var util = require("util"), EventEmitter = require("events").EventEmitter;

var ssdp = require('node-ssdp'), client = new ssdp();
var URL = require('url');
var http = require('http');

var Cache = require('./simplecache').ExpiryCache;

var parseString = require('xml2js').parseString;

var DEFAULT_INTERVAL = 10000;
var DIAL_PROTOCOL = 'urn:dial-multiscreen-org:service:dial:1';

module.exports.Discovery = Discovery;


function Discovery(opts) {
	opts = opts || {interval: DEFAULT_INTERVAL}; //every 5 seconds
	this.interval = opts.interval || DEFAULT_INTERVAL;
	this.notify = !!opts.notify;

	this.startTimer = 0;
	this.stopped = false;
	this.simpleCache = new Cache();


	EventEmitter.call(this);

	var self = this;
	client.on('response', function (headers, info) {
		handleResponse(self, parseHeaders((headers || "").toString()), info)
	});
}

util.inherits(Discovery, EventEmitter);

Discovery.prototype.start = function (interval) {
	if (this.startTimer) {
		//gonna clear it out
		clearInterval(this.startTimer);
	}
	var intervalValue = interval || this.interval;

	startDiscovery.bind(this).call(null);
	this.startTimer = setInterval(startDiscovery.bind(this), intervalValue);
};

Discovery.prototype.stop = function () {
	this.stopped = true;
	clearInterval(this.startTimer);
};


function startDiscovery() {
	if (this.stopped) {
		clearInterval(this.startTimer);
		return;
	}

	client.search(DIAL_PROTOCOL);
}

function handleResponse(discovery, headers, info) {
	if (discovery.simpleCache.containsKey(headers.location)) {
		return;
	}

	//start fetching the info
	if (discovery.notify) {
		discovery.emit('metadata', {headers: headers, info: info});
	}

	discovery.simpleCache.pushKey(headers.location);

	//fetching the device info from the location
	http.get(headers.location,function (res) {

		var appUrl = res.headers["application-url"];
		//TODO: [medium] (nhat) - right now it's xml, consider support for different type in the future
//		var contentType = res.headers["content-type"];
		var data = "";
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			parseXML(discovery, appUrl, data);
		});
	}).on('error', function (err) {
			discovery.emit('error', err);
		});
}


function parseXML(discovery, appUrl, data) {
	parseString(data, {trim: true, explicitArray: false}, function (err, result) {
		var device = result.root.device;
		device["baseUrl"] = result.root.URLBase;
		device["appUrl"] = appUrl;
		discovery.simpleCache.pushValue(device);
		discovery.emit('discovered', device);
	});
}

/**
 * parse the headers into understandable json
 * @param headers
 */
function parseHeaders(headers) {
	var result = {};
	var lines = headers.split("\r\n");
	lines.forEach(function (item, i) {
		if (i == 0) { //first one, check the stat
			var status = item.split(" ");
			if (status.length == 3) {
				result["version"] = status[0];
				result["responsecode"] = status[1];
				result["status"] = status[2];
				return;
			}
		}
		if (item.length) {
			var split = item.split(": ");
			result[cleanse(split[0]).toLowerCase()] = cleanseValue(split[1]);
		}
	});
	return result;
}

function cleanse(val) {
	if (val) {
		return  val.replace(/[|&;$%@"<>()+,-.]/g, "");
	}
	return "";
}

function cleanseValue(val) {
	if (val) {
		return  val.replace(/["]/g, "");
	}
	return "";
}

