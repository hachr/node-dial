/*
 *
 */

//TODO: [high] (nhat) - clean this up since this is test code!
//TODO: [high] (nhat) - remove logging from SSDP package.

var ssdp = require('node-ssdp')
	, http = require('http')
  , server = new ssdp();

var address = null;

//directly set the properties on the server
server.description = "ssdp/dial.xml";

var webserver = http.createServer(function(request,response){
	//TODO: [high] (nhat) - receive launch url here and do stuff w/ it.

	if(request.url === "/ssdp/dial.xml"){
		console.log("write head");
		response.writeHead(200,{"LOCATION": "http://" + address + ":9009"});
		console.log("write body");
		response.end('<?xml version="1.0"?> \
		<root xmlns="urn:schemas-upnp-org:device-1-0"> \
		  <specVersion> \
		    <major>1</major> \
		    <minor>0</minor> \
		  </specVersion> \
		  <URLBase>blah blah blah</URLBase> \
		  <device> \
		    <deviceType>urn:dial-multiscreen-org:device:dial:1</deviceType> \
		    <friendlyName>nhat was here!</friendlyName> \
		    <manufacturer>Nhat vo</manufacturer> \
		    <modelName>what?</modelName> \
		    <UDN>my uuid</UDN> \
		    <iconList> \
		      <icon> \
		        <mimetype>image/png</mimetype> \
		        <width>98</width> \
		        <height>55</height> \
		        <depth>32</depth> \
		        <url>/setup/icon.png</url> \
		      </icon> \
		    </iconList> \
		    <serviceList> \
		      <service> \
		        <serviceType>urn:dial-multiscreen-org:service:dial:1</serviceType> \
		        <serviceId>urn:dial-multiscreen-org:serviceId:dial</serviceId> \
		        <controlURL>/ssdp/notfound</controlURL> \
		        <eventSubURL>/ssdp/notfound</eventSubURL> \
		        <SCPDURL>/ssdp/notfound</SCPDURL> \
		      </service> \
		    </serviceList> \
		  </device> \
		</root>');
		response.end();
	}else{
		response.writeHead(403);
	}
});

webserver.listen(9009);

server.addUSN('urn:dial-multiscreen-org:service:dial:1');

server.on('advertise-alive', function (heads) {
});

server.on('advertise-bye', function (heads) {
});



// This should get your local ip to pass off to the server.
require('dns').lookup(require('os').hostname(), function (err, add) {
	console.log(add);
	address = add;

	//TODO: [high] (nhat) - if ip is 0.0.0.0, it's broadcast address
	//TODO: [high] (nhat) - but it's not correct for the LOCATION address.
//  server.server(add, 9009);
  server.server("0.0.0.0", 9009);
	server.httphost = "http://" + address + ":9009";
});


