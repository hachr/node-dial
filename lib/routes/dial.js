var config = require('../../config.json');

function description(req, res) {
	//pulling out uuid from app.locals
	var content = createDialXML(req.app.locals.uuid);
	sendXml(res, content);
}

function query(req, res) {
	var appName = req.params.appName;
	var appAvailable = false;
	if (appAvailable) {
		var status = "running";
		sendXml(res, createDialStatusXML(appName, status));
	} else {
		res.send(404);
	}
}

function launch(req, res) {
	var appName = req.params.appName;
	//TODO: [high] (nhat) - launch
}

function terminate(req, res) {
	var appName = req.params.appName;

	//if app is running, kill, otherwise, send back 404
}


module.exports.description = description;
module.exports.query = query;
module.exports.launch = launch;
module.exports.terminate = terminate;

function sendXml(res, xml) {
	res.setHeader('Content-Type', 'application/xml');
	res.setHeader('Content-Length', xml.length);
	res.end(xml);
}

//TODO: [low] (nhat) - put this in a util so external handler can use it
function createDialStatusXML(name, status) {
	return '<?xml version="1.0" encoding="UTF-8"?>' +
		'<service xmlns="urn:dial-multiscreen-org:schemas:dial">' +
		'<name>' + name + '</name>' +
		'<options allowStop="true"/>' +
		'<state>' + status + '</state>' +
		'</service>';
}

//TODO: [low] (nhat) - put this in a util so external handler can use it
function createDialXML(uuid) {
	var data = '';
	data += '<?xml version="1.0"?>';
	data += '<root xmlns="urn:schemas-upnp-org:device-1-0">\n';
	data += '	<specVersion>\n';
	data += '		<major>1</major>\n';
	data += '    <minor>0</minor>\n';
	data += '  </specVersion>\n';
	data += '	<device>\n';
	data += '	<deviceType>urn:dial-multiscreen-org:device:dial:1</deviceType>\n';
	data += '		<friendlyName>' + config.device.name + '</friendlyName>\n';
	data += '   <manufacturer>' + config.vendor.name + '</manufacturer>\n';
	data += '   <manufacturerURL>' + config.vendor.url + '</manufacturerURL>\n';
	data += '   <modelDescription>' + config.device.description + '</modelDescription>\n';
	data += '   <modelName>' + config.device.model + '</modelName>\n';
	data += '   <UDN>uuid:' + uuid + '</UDN>\n';
	data += '		<iconList>'; //TODO: [medium] (nhat) - handle this dynamically?
	data += '   	<icon>';
	data += '				<mimeType>image/png</mimeType>';
	data += '     	<width></width>';
	data += '     	<height></height>';
	data += '     	<depth></depth>';
	data += '     	<url></url>';
	data += '   	</icon>';
	data += '		</iconList>';
	data += '		<serviceList>';
	data += '			<service>';
	data += '   		<serviceType>>urn:dial-multiscreen-org:service:dial:1</serviceType>';
	data += '     	<serviceId>urn:dial-multiscreen-org:serviceId:dial</serviceId>';
	data += '     	<controlURL>/control.xml</controlURL>';
	data += '     	<eventSubURL>/events.xml</eventSubURL>';
	data += '     	<SCPDURL>/scpd.xml</SCPDURL>';
	data += '			</service>';
	data += '		</serviceList>\n';
	data += '		<presentationURL>/</presentationURL>\n';
	data += '	</device>\n';
	data += '</root>\n';
	return data;
}