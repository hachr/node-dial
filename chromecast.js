var Discovery = require("./lib/discovery").Discovery;

var discovery = new Discovery({notify: true}); //TODO: [medium] (nhat) - change notify to something that make more sense.

var devices = [];

discovery.on('discovered', function (data) {
    devices.push(new Chromecast(data, "YouTube"));
});


discovery.start();


var http = require("http");
var url = require("url");
var util =require("util");
var parseString = require('xml2js').parseString;

function Chromecast(data, appId) {
    this.appId = appId;
    this.data = data;
    this.status = null;
    this.url = url.parse(this.data.appUrl + this.appId);
    this.requestStatus();
}

Chromecast.prototype.getStatus = function () {
    return this.status;
};
//todo emit ready so we can start using it
Chromecast.prototype.requestStatus = function(){
    var opt = {
        method: 'GET',
        path: this.url.path,
        hostname: this.url.hostname,
        port: this.url.port
    };
    var self = this;
    this.send(opt,null, function(xml){
        parseString(xml, {trim: true, explicitArray: false}, function (err, result) {
            if(result){
console.log(result);
            var status = {};
            status.running = result.service.state === "running";

            if(result.service.servicedata){
            util._extend(status,result.service.servicedata); //connectionSvcURL
            util._extend(status,result.service.servicedata.protocols); //protocol
            }
            util._extend(status,result.service.options.$); //allowStop
            util._extend(status,result.service['activity-status']); //description

            self.status = status;
            }
        });
    });
};

Chromecast.prototype.getName = function(){
    return this.data.friendlyName;
};

//simple post to the appId to kill the app
Chromecast.prototype.kill = function () {
    var opt = {
        method: 'DELETE',
        path: this.url.path,
        hostname: this.url.hostname,
        port: this.url.port
    };
    this.send(opt);
};

Chromecast.prototype.launch = function(param){
    var opt = {
        method: 'POST',
        path: this.url.path,
        hostname: this.url.hostname,
        port: this.url.port
    };
    this.send(opt, param);
};

Chromecast.prototype.send = function(options, data, callback){
    console.log("requesting: " + JSON.stringify(options));
    var req = http.request(options, function (res) {
        var d = "";
        res.on('data', function(chunk){
            d += chunk;
        });

        res.on('end', function(){
            if(callback){
                callback(d);
            }
        });
    });

    req.on('error', function (e) {
        //todo notify error
    });

    if(data){
        req.write(data);
    }
    req.end();
};
