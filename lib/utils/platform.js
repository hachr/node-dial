var os = require('os');
var uuid = require('node-uuid');

function getHostname() {
	return os.hostname();
}

function getIPAddresses() {
	var result = [];
	var interfaces = os.networkInterfaces();
	for (var i in interfaces) {
		for (var idx in interfaces[i]) {
			var addr = interfaces[i][idx];
			result.push(addr);
		}
	}
	return result;
}

/**
 *
 * @param {boolean?} allowInternal
 * @returns {*|Function|.contextGrabbers.p.address|address|Manager.handshakeData.address|address|page.address|page.address}
 */
function getIPv4Address(allowInternal) {
	var addresses = getIPAddresses();
	for (var i = 0; i < addresses.length; i++) {
		var item = addresses[i];
		if (item.family === 'IPv4' && (allowInternal ? item.internal : !item.internal)) {
			return item.address;
		}
	}
}

exports.getIPv4Address = getIPv4Address;
exports.getIPAddresses = getIPAddresses;
exports.getHostname = getHostname;
exports.uuid = uuid.v4;