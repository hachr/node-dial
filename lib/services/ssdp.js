var utils = require('../utils');
var logger = utils.logger;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dgram = require('dgram');
var json = require('../../package.json');
var dns = require('dns');

function SSDP(config) {

	if (!(this instanceof SSDP)) return new SSDP(config);

	this.serverIdentifier = config.serverIdentifier || "node.js UPnP/1.1 " + json.name + "/" + json.version;
	this.ssdpPort = config.port || 1900;
	this.ssdpAddress = config.address || '239.255.255.250';
	this.ttl = config.ttl || 1800;

	this.ssdpURL = this.ssdpAddress + ":" + this.ssdpPort;
	this.URL = "http://" + utils.platform.getIPv4Address() + ":" + config.dialPort + config.dialPath;

	var socket = dgram.createSocket('udp4');
	this.socket = socket;
	this.usns = {}; //unique service name
	this.udn = 'uuid:' + (config.uuid || utils.platform.uuid());

	socket.on('error', function () {
		logger.error("Socket error!!");
	});


	socket.on('listening', function () {
		var address = socket.address();
		logger.info("SSDP listening - " + address.address + " on " + address.port);
		socket.addMembership(this.ssdpAddress);
		socket.setMulticastTTL(2);
	}.bind(this));

	socket.on('message', function (msg, rinfo) {
		logger.verbose('message\n', msg.toString(), rinfo);
		var type = msg.toString().split('\r\n').shift();
		// HTTP/#.# ### Response
		if (type.match(/HTTP\/(\d{1})\.(\d{1}) (\d+) (.*)/)) {
			this.handleResponse(msg, rinfo);
		} else {
			this.handleCommand(msg, rinfo);
		}
	}.bind(this));

	process.on('exit', function () {
		this.close();
	}.bind(this));

	EventEmitter.call(this);
};

util.inherits(SSDP, EventEmitter);

/**
 *
 * @param msg
 * @param rinfo
 */
SSDP.prototype.handleResponse = function handleResponse(msg, rinfo) {
	this.emit('response', msg, rinfo);
};

/**
 *
 * @param msg
 * @param rinfo
 */
SSDP.prototype.handleCommand = function handleCommand(msg, rinfo) {
	var lines = msg.toString().split("\r\n");
	var type = lines.shift().split(' ');
	var method = type[0];
	var headers = {};

	for (var l in lines) {
		var line = lines[l];
		if (line.length < 1) {
			continue;
		}
		var val = line.match(/^([^:]+):\s*(.*)$/);
		headers[val[1].toUpperCase()] = val[2];
	}
	switch (method) {
		case 'NOTIFY':
			if (headers['NTS'] === 'ssdp:alive') {
				this.emit('advertise-alive', headers);
			}
			else if (headers['NTS'] === 'ssdp:byebye') {
				this.emit('advertise-bye', headers);
			}
			else {
				logger.debug('ignored NOTIFY');
			}
			break;
		case 'M-SEARCH':
			if (!headers['MAN']) {
				return;
			}
			if (!headers['MX']) {
				return;
			}
			if (!headers['ST']) {
				return;
			}
			this.handleMSearch(headers['ST'], rinfo);
			break;
		default:
			logger.debug("Unknown message: \r\n" + msg);
	}
};

/**
 *
 * @param st
 * @param rinfo
 */
SSDP.prototype.handleMSearch = function handleMSearch(st, rinfo) {
	var peer = rinfo['address'];
	var port = rinfo['port'];
	if (st[0] === '"') {
		st = st.slice(1, -1);
	}
	for (var usn in this.usns) {
		var udn = this.usns[usn];
		if (st === 'ssdp:all' || usn === st) {
			var headers = buildMessageHeader(null, {
				USN: udn,
				ST: usn,
				LOCATION: this.URL,
				'CACHE-CONTROL': 'max-age=' + this.ttl,
				DATE: new Date().toUTCString(),
				SERVER: this.serverIdentifier,
				EXT: ''
			});
			var data = new Buffer(headers);
			this.socket.send(data, 0, data.length, port, peer);
		}
	}
};

/**
 *
 * @param {string} usn
 */
SSDP.prototype.addUSN = function (usn) {
	this.usns[usn] = this.udn + "::" + usn;
};

/**
 *
 * @param {string} target
 */
SSDP.prototype.search = function (target) {
	dns.lookup(util.platform.getIPv4Address(), function (error, address) {
		this.socket.bind(0, address);

		var headers = buildMSearch({
			HOST: this.ssdpURL,
			ST: target,
			MAN: '"ssdp:discover"',
			MX: 3
		});
		logger.debug("Searching", headers);
		var data = new Buffer(headers);
		this.socket.send(data, 0, data.length, this.ssdpPort, this.ssdpAddress);
	}.bind(this));
};

/**
 *
 * @param {boolean} alive
 */
SSDP.prototype.advertise = function (alive) {
	if (!this.socket) {
		return;
	}
	if (alive === undefined) {
		alive = true;
	}

	Object.keys(this.usns).forEach(function (usn) {
		var headers = {
			HOST: this.ssdpURL,
			NT: usn,
			NTS: 'ssdp:' + (alive ? 'alive' : 'byebye'),
			USN: this.usns[usn]
		};
		if (alive) {
			headers['LOCATION'] = this.URL;
			headers['CACHE-CONTROL'] = 'max-age=' + this.ttl;
			headers['SERVER'] = this.serverIdentifier
		}

		var data = new Buffer(buildNotify(headers));
		logger.debug("advertising %s", data.toString());
		this.socket.send(data, 0, data.length, this.ssdpPort, this.ssdpAddress);
	}.bind(this));
};

function buildNotify(headers) {
	return buildMessageHeader("NOTIFY", headers);
}

function buildMSearch(headers) {
	return buildMessageHeader("M-SEARCH", headers);
}

/**
 * NOTIFY * HTTP/1.1\r\n
 * M-SEARCH * HTTP/1.1\r\n
 * HTTP/1.1 200 OK\r\n
 */
function buildMessageHeader(command, headers) {
	var ret;

	if (command === "NOTIFY" || command === "M-SEARCH") {
		ret = command + " * HTTP/1.1\r\n";
	} else {
		ret = "HTTP/1.1 200 OK\r\n";
	}

	for (var h in headers) {
		ret += h + ": " + headers[h] + "\r\n";
	}
	return ret + "\r\n";
}

/**
 * stop it.
 */
SSDP.prototype.close = function () {
	this.advertise(false);
	this.advertise(false);
	this.socket.close();
};

SSDP.prototype.server = function () {
	this.usns[this.udn] = this.udn;
	this.socket.bind(this.ssdpPort);
	// Shut down.
	this.advertise(false);
	setTimeout(this.advertise.bind(this), 1000, false);
	// Wake up.
	setTimeout(this.advertise.bind(this), 2000);
	setTimeout(this.advertise.bind(this), 3000);
	// Ad loop.
	setInterval(this.advertise.bind(this), 10000);
};


module.exports = SSDP;


/*
 ADVERTISE:

 NOTIFY * HTTP/1.1
 HOST: 239.255.255.250:1900
 CACHE-CONTROL: max-age = seconds until advertisement expires
 LOCATION: URL for UPnP description for root device
 NT: notification type
 NTS: ssdp:alive
 SERVER: OS/version UPnP/1.1 product/version
 USN: composite identifier for the advertisement
 BOOTID.UPNP.ORG: number increased each time device sends an initial announce or an update message
 CONFIGID.UPNP.ORG: number used for caching description information
 SEARCHPORT.UPNP.ORG: number identifies port on which device responds to unicast M-SEARCH


 NOTIFY * HTTP/1.1
 HOST: 239.255.255.250:1900
 NT: notification type
 NTS: ssdp:byebye
 USN: composite identifier for the advertisement
 BOOTID.UPNP.ORG: number increased each time device sends an initial announce or an update message
 CONFIGID.UPNP.ORG: number used for caching description information



 NOTIFY * HTTP/1.1
 HOST: 239.255.255.250:1900
 LOCATION: URL for UPnP description for root device
 NT: notification type
 NTS: ssdp:update
 USN: composite identifier for the advertisement
 BOOTID.UPNP.ORG: BOOTID value that the device has used in its previous announcements CONFIGID.UPNP.ORG: number used for caching description information
 NEXTBOOTID.UPNP.ORG: new BOOTID value that the device will use in subsequent announcements SEARCHPORT.UPNP.ORG: number identifies port on which device responds to unicast M-SEARCH


 SEARCH:

 M-SEARCH * HTTP/1.1
 HOST: 239.255.255.250:1900
 MAN: "ssdp:discover"
 MX: seconds to delay response
 ST: search target
 USER-AGENT: OS/version UPnP/1.1 product/version

 M-SEARCH * HTTP/1.1
 HOST: hostname:portNumber
 MAN: "ssdp:discover"
 ST: search target
 USER-AGENT: OS/version UPnP/1.1 product/version

 RESPONSE:

 HTTP/1.1 200 OK
 CACHE-CONTROL: max-age = seconds until advertisement expires
 DATE: when response was generated
 EXT:
 LOCATION: URL for UPnP description for root device
 SERVER: OS/version UPnP/1.1 product/version
 ST: search target
 USN: composite identifier for the advertisement
 BOOTID.UPNP.ORG: number increased each time device sends an initial announce or an update message
 CONFIGID.UPNP.ORG: number used for caching description information
 SEARCHPORT.UPNP.ORG: number identifies port on which device responds to unicast M-SEARCH

 */
