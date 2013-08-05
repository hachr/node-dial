//TODO: [high] (nhat) - pick a test framework!!!!

var Cache = require('../lib/simplecache').ExpiryCache;


var cache = new Cache({expiry: 1000});

function assertEquals(arg1, arg2) {
	if (arg1 !== arg2) {
		throw new Error("assert equals failed, expecting [" + arg1 + "], but got [" + arg2 + "]");
	}
}


cache.pushKey("key");
cache.pushKey("key1");
cache.pushValue("value");
cache.pushValue("value1");
cache.pushKey("key2");
cache.pushValue("value2");
cache.pushValue("value3");

assertEquals("value", cache.get("key"));
assertEquals("value1", cache.get("key1"));
assertEquals("value2", cache.get("key2"));
assertEquals(null, cache.get("key3"));

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
