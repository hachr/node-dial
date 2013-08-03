var util = require("util");
var aop = require("./aop");

var FIVE_MINUTES = 1000 * 60 * 5;

/**
 * simple map allow pushing key and then value later like an array format
 * @constructor
 */
function SimpleCache() {
	this.map = {};
	this.temp = null;
}

SimpleCache.prototype.pushKey = function (key) {
	if (this.temp) {
		throw new Error("cannot push key after key, expecting value");
	}
	this.temp = key;
};

SimpleCache.prototype.pushValue = function (value) {
	if (!this.temp) {
		throw new Error("cannot push value, expecting key");
	}
	this.map[this.temp] = value;
	this.temp = null;
};

SimpleCache.prototype.remove = function (key) {
	var val = this.map[key];
	this.map[key] = null;
	delete this.map[key];
	return val;
};

SimpleCache.prototype.get = function (key) {
	return this.map[key];
};


SimpleCache.prototype.containsKey = function (value) {
	return !!this.map[value];
};

SimpleCache.prototype.clear = function () {
	this.map = null;
	this.temp = null;
};


/**
 * use aop to tweak the behavior
 * @constructor
 */
function ExpiryCache(opts) {
	opts = opts || {expiry: FIVE_MINUTES};
	var expiry = opts.expiry || FIVE_MINUTES;

	SimpleCache.call(this);

	//when pushing value, add timestamp
	this.pushValue = aop.before(this.pushValue, function (arg) {
		return {value: arg, timestamp: Date.now()};
	});

	//when checking for key, make sure it's not expired
	this.containsKey = aop.afterReturning(this.containsKey, function (arg, result) {
		var ret = this.get(arg[0]);
		return !!ret;
	});

	//when get the value, clear cache and remove timestamp
	this.get = aop.afterReturning(this.get, function (arg, result) {
		if (result) {
			if (Date.now() - result.timestamp > expiry) {
				this.remove(arg[0]);
				return null;
			}
			return result.value;
		}
		return null;
	});
}

util.inherits(ExpiryCache, SimpleCache);


module.exports.SimpleCache = SimpleCache;
module.exports.ExpiryCache = ExpiryCache;