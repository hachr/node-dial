var Discovery = require("./lib/discovery").Discovery;

var discovery = new Discovery({notify: true}); //TODO: [medium] (nhat) - change notify to something that make more sense.

discovery.on('metadata', function (data) {
	console.log("metadata");
	console.log(JSON.stringify(data));
});

discovery.on('discovered', function (data) {
	console.log("discovered");
	console.log(JSON.stringify(data));
});


discovery.start();


setTimeout(function(){
	discovery.stop();
}, 12000);