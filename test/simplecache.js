//TODO: [high] (nhat) - pick a test framework!!!!

var Cache = require('../lib/simplecache').ExpiryCache;


var cache = new Cache({expiry: 1000});

function assertEquals(arg1, arg2) {
	if (arg1 !== arg2) {
		throw new Error("assert equals failed, expecting [" + arg1 + "], but got [" + arg2 + "]");
	}
}


cache.pushKey("key");
cache.pushValue("value");

assertEquals("value", cache.get("key"));

setTimeout(function () {
	assertEquals(true, cache.containsKey("key"));
	assertEquals("value", cache.get("key"));
}, 500);

setTimeout(function () {
	assertEquals(false, cache.containsKey("key"));
	assertEquals(null, cache.get("key"));
}, 1500);

setTimeout(function () {
	assertEquals(false, cache.containsKey("key"));
	assertEquals(null, cache.get("key"));
}, 2000);
