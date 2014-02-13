/*
 * Originally from https://github.com/briancavalier/aop-jsconf-2013
 *
 * Note:
 * Tweaked for better usage, such as pass the arguments along with result to after advices and capture the result from
 * advices
 *
 */
var slice = Function.prototype.call.bind([].slice);

// Very simple advice functions
module.exports = {
	before: before,
	afterReturning: afterReturning,
	afterThrowing: afterThrowing,
	after: after,
	around: around
};

/**
 * Call advice before f, with the same arguments
 * modified: return value from advice will become arguments for the function
 *
 * @param  {function} f function to advise
 * @param  {function} advice function to call before f
 * @return {function} advised function that will call advice before f
 */
function before(f, advice) {
	return function () {
		var r = advice.apply(this, arguments);
		if (typeof(r) !== "undefined") {
			return f.apply(this, Array.isArray(r) ? r : [r]);
		}
		return f.apply(this, arguments);
	};
}

/**
 * Call advice with f's arguments and return value, after f returns successfully
 * @param  {function} f function to advise
 * @param  {function} advice function to call after f returns
 * @return {function} advised function that will call advice after f returns
 */
function afterReturning(f, advice) {
	return function () {
		var result = f.apply(this, arguments);
		var r = advice.call(this, arguments, result);
		if (typeof(r) !== "undefined") {
			return r;
		}
		return result;
	};
}

/**
 * Call advice with arguments and exception thrown by f, if f throws
 * @param  {function} f function to advise
 * @param  {function} advice function to call after f throws
 * @return {function} advised function that will call advice after f throws
 */
function afterThrowing(f, advice) {
	return function () {
		try {
			return f.apply(this, arguments);
		} catch (e) {
			advice.call(this, arguments, e);
			throw e;
		}
	};
}

/**
 * Call advice after f returns or throws along with f's arguments
 * @param  {function} f function to advise
 * @param  {[type]} advice function to call after f returns or throws
 * @return {function} advised function that will call advice after f returns or throws
 */
function after(f, advice) {
	return function () {
		var result, threw;
		try {
			result = f.apply(this, arguments);
		} catch (e) {
			threw = true;
			result = e;
		}

		var r = advice.call(this, arguments, result);
		if (threw) {
			throw result;
		} else {
			if (typeof(r) !== "undefined") {
				return r;
			}
			return result;
		}
	};
}

/**
 * Call advice "around" f: passes f and f's arguments to advice, which
 * can then do some work, call f, then do more work .. thus "around".
 * @param  {function} f function to advise
 * @param  {function} advice function to call "around" f
 * @return {function} advised function that will call advice "around" f
 */
function around(f, advice) {
	return function () {
		// Use bind to preserve `thisArg` when passing f to advice
		return advice.call(this, f.bind(this), slice(arguments));
	};
}