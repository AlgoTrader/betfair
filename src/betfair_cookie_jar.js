// (C) 2013 Anton Zemlyanov
// Betfair cookie jar
// Keep all the cookies Betfair needs

var cookie = require('cookie');

var cookies = {};

function clearCookies(cookies) {
	cookies = {};
}

function getCookie(name) {
	return {
		name: name,
		value: cookies[name]
	};
}

function setCookie(name, value) {
	cookies[name] = value;
}

function parseCookies(arr) {
	arr = arr || [];
	for (var i = 0; i < arr.length; ++i) {
		var parsed = cookie.parse(arr[i]);
		var name = Object.keys(parsed)[0];
		cookies[name] = parsed[name];
	}
}

function serializeCookies() {
	var allCookies = [];
	for(var key in cookies) {
		allCookies.push(key+"="+cookies[key]);
	}
	return allCookies.join('; ');
}

module.exports = {
	clearCookies: clearCookies,
	getCookie: getCookie,
	setCookie: setCookie,
	parseCookies: parseCookies,
	serializeCookies: serializeCookies
}
