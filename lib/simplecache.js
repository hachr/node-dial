var util = require("util");
var aop = require("./aop");

var FIVE_MINUTES = 1000 * 60 * 5;

/**
 * simple map allow pushing key and then value later like an array format
 * //push key1, push key2, push val1, push key3, push val2, push val3.
 * //-> key1->val1, key2->val2, key3->val3
 * //
 * @constructor
 */
function SimpleCache() {
	this.map = {};
	this.keys = [];
	this.values = [];
}

SimpleCache.prototype.pushKey = function (key) {
	this.keys.push(key);
};

SimpleCache.prototype.pushValue = function (value) {
	var key = this.keys.splice(0, 1);
	var val = null;

	if (this.values.length == 0) {
		val = value;
	} else {
		this.values.push(value);
		val = this.values.splice(0, 1);
	}
	this.map[key] = val;
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