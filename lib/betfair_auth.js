// (C) 2013 Anton Zemlyanov
// Betfair authorization
// Implements both "interactive" and "bot" auth methods

var https = require('https');
var querystring = require('querystring');
var url = require('url');
var cookie = require('cookie');
var fs = require('fs');
var async = require('async');
var cookieJar = require('./betfair_cookie_jar.js')

var config = {
	interactiveLogin: 'https://identitysso.betfair.com:443/api/login',
	botLogin: 'https://identitysso-api.betfair.com:443/api/certlogin',
    logout: 'https://identitysso.betfair.com:443/api/logout',
    keepAlive: 'https://identitysso.betfair.com:443/api/keepAlive'
};

function postRequest(formData, uri, opts, cb) {
	var data = querystring.stringify(formData);

	var options = url.parse(uri);
	options.method = 'POST';
	options.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		'Content-Length': data.length,
		'X-Application': 'BetfairAPI'
	};
	for(var key in opts) {
		options[key] = opts[key];
	}

	// SSL requires special agent
	if(options.key && options.cert) {
		options.agent = new https.Agent({key: options.key ,cert: options.cert});
	}

	var cookies = cookieJar.serializeCookies();
	if(cookies) {
		options.headers['Cookie'] = cookies;
	}
	console.log(options);

	var startTime = new Date();
	var req = https.request(options, function (res) {
		var endTime = new Date();
		var duration = endTime - startTime;
		var responseBody = "";
		res.on('data', function(data) {
			responseBody += data;
		});
		res.on('end', function() {
			console.log(res.headers);

			// try to guess reject reason if not 200 OK
			if (res.statusCode != 200) {
				var reason = "Bad HTTP code:" + res.statusCode;
				// if 302, then analyze Location header to provide better reason
				if (res.statusCode == 302) {
					var location = res.headers['location'] || '';
					var match = location.match(/&errorCode=([A-Z_]+)&/);
					if (match) {
						reason = match[1];
					}
				}
				cb(reason);
				return;
			}

			var cookies = res.headers['set-cookie'] || [];
			cookieJar.parseCookies(cookies);
			cookieJar.setCookie('mSsoToken', cookieJar.getCookie('ssoid').value);

			// return statusCode, body, cookies
			var result = {
				duration: duration,
				statusCode: res.statusCode,
				body: responseBody,
				cookies: cookies
			};
			console.log(result)
			cb(null, result);
		});
	});
	req.end(data);
}

function interactiveLogin(login, password, cb) {
	cb = cb || function () {
	};

	var formData = {
		username: login,
		password: password,
		login: true,
		redirectMethod: 'POST',
		product: 'home.betfair.int',
		url: 'https://www.betfair.com/'
	};

	postRequest(formData, config.interactiveLogin, {}, function (err, res) {
		if (err) {
			cb(err, res);
			return;
		}

		// extract cookie ssoid
		var cookies = res.cookies;
		for (var i = 0; i < cookies.length; ++i) {
			var item = cookies[i];
			var parsed = cookie.parse(item);
			if (parsed.ssoid) {
				var sessionKey = parsed.ssoid;
				break;
			}
		}
		if (!sessionKey) {
			cb("No ssoid cookie in response");
			return;
		}
		cookieJar.parseCookies(cookies);

		// success
		cb(null, {
			duration: res.duration,
			sessionKey: sessionKey,
			loginStatus: "SUCCESS",
			type: "interactive"
		});
	});
}

function botLogin(login, password, sslOptions, cb) {
	sslOptions = sslOptions || {};
	cb = cb || function () {
	};

	var formData = {
		username: login,
		password: password
	};

	postRequest(formData, config.botLogin, sslOptions, function (err, res) {
		if(err) {
			cb(err, res);
			return;
		}

		try {
			var response = JSON.parse(res.body);
		} catch (e) {
			var response = {loginStatus: "Got bad JSON from Betfair server"};
		}
		response.type = "bot";
		response.duration = res.duration;
		response.sessionKey = response.sessionToken;

		if (response.loginStatus === 'SUCCESS') {
			cb(null, response)
		} else {
			cb(response.loginStatus, response);
		}
	});
}

function logout(sessionKey, cb) {
	cb = cb || function () {
	};

	var formData = {
		product: 'home.betfair.int',
		url: 'https://www.betfair.com/'
	};

	// {'X-Authentication':sessionKey}
	postRequest(formData, config.logout, {}, function (err, res) {
		if(err) {
			cb(err, res);
			return;
		}

		var match = res.body.match(/type="hidden" name="errorCode" value="(\w+)"/);
		if(match) {
			cb(match[1]);
			return;
		}

		cb(null, {
			duration: res.duration,
			logoutStatus: "SUCCESS",
			type: "interactive"
		});
	});
}

function keepAlive(sessionKey, cb) {
	cb = cb || function () {
	};

	var formData = {
	};

	// {'X-Authentication':sessionKey}
	postRequest(formData, config.keepAlive, {}, function (err, res) {
		if(err) {
			cb(err, res);
			return;
		}

		cb(null, {
			duration: res.duration,
			keepAliveStatus: "SUCCESS",
			type: "interactive"
		});
	});
}


module.exports = {
    interactiveLogin: interactiveLogin,
	botLogin: botLogin,
	keepAlive: keepAlive,
	logout: logout
};
