// (C) 2013 Anton Zemlyanov
// Betfair authorization
// Implements both "interactive" and "bot" auth methods

var https = require('https');
var querystring = require('querystring');
var us = require('underscore');
var url = require('url');
var cookie = require('cookie');
var fs = require('fs');
var async = require('async');
var cookieJar = require('./betfair_cookie_jar.js');


function Auth() {
    var self = this;
    
    self.log = null;

    self.config = {
        interactiveLogin: 'https://identitysso.betfair.com:443/api/login',
        botLogin: 'https://identitysso-api.betfair.com:443/api/certlogin',
        logout: 'https://identitysso.betfair.com:443/api/logout',
        keepAlive: 'https://identitysso.betfair.com:443/api/keepAlive'
    };
}

Auth.prototype = Auth.fn = {};

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
		if(key!=='headers') {
			options[key] = opts[key];
		} else {
			us.extend(options.headers, opts[key]);
		}
	}

	// SSL requires special agent
	if(options.key && options.cert) {
		options.agent = new https.Agent({key: options.key ,cert: options.cert});
	}

	var cookies = cookieJar.serializeCookies();
	if(cookies) {
		options.headers['Cookie'] = cookies;
	}

	var startTime = new Date();
	var req = https.request(options, function (res) {
		var endTime = new Date();
		var duration = endTime - startTime;
		var responseBody = "";
		res.on('data', function(data) {
			responseBody += data;
		});
		res.on('end', function() {
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
			cb(null, result);
		});
	});
	req.on('error', function(err) {
	    cb('Network error:'+err.message);
	});
	req.end(data);
}

Auth.fn.interactiveLogin = function(login, password, cb) {
        var self = this;
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

	postRequest(formData, this.config.interactiveLogin, {}, function (err, res) {
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
		
		// log invocation
		logInvocation(self, 'interactiveLogin', res.duration, true, res.body.length, res.statusCode);

		// success
		cb(null, {
			duration: res.duration,
			sessionKey: sessionKey,
			loginStatus: "SUCCESS",
			type: "interactive"
		});
	});
};

Auth.fn.botLogin = function(login, password, sslOptions, cb) {
        var self = this;
	sslOptions = sslOptions || {};
	cb = cb || function () {
	};

	var formData = {
		username: login,
		password: password
	};

	postRequest(formData, this.config.botLogin, sslOptions, function (err, res) {
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

                
		// log invocation
		logInvocation(self, 'botLogin', res.duration, response.loginStatus !== 'SUCCESS', res.body.length, res.statusCode);
                
		if (response.loginStatus !== 'SUCCESS') {
			cb(response.loginStatus, response);
			return;
		}
		cb(null, response)
	});
};

Auth.fn.logout = function(sessionKey, cb) {
        var self = this;
	cb = cb || function () {
	};

	var formData = {
		product: 'home.betfair.int',
		url: 'https://www.betfair.com/'
	};

	// {'X-Authentication':sessionKey}
	var opts = {
		headers: {
		    "Accept": "application/json",
		    "X-Authentication": sessionKey
		}
	};
	postRequest(formData, this.config.logout, opts, function (err, res) {
		if(err) {
			cb(err, res);
			return;
		}

		// log invocation
		logInvocation(self, 'logout', res.duration, true, res.body.length, res.statusCode);

		cb(null, {
			duration: res.duration,
			logoutStatus: "SUCCESS",
			type: "interactive",
			result: res
		});
	});
};

Auth.fn.keepAlive = function(sessionKey, cb) {
        var self = this;
	cb = cb || function () {
	};

	var formData = {
	};

	// {'X-Authentication':sessionKey}
	var opts = {
		headers: {
		    "Accept": "application/json",
		    "X-Authentication": sessionKey
		}
	};
	postRequest(formData, this.config.keepAlive, opts, function (err, res) {
		if(err) {
			cb(err, res);
			return;
		}
		
		// log invocation
		logInvocation(self, 'keepAlive', res.duration, true, res.body.length, res.statusCode);
		
		cb(null, {
			duration: res.duration,
			keepAliveStatus: "SUCCESS",
			type: "interactive",
			response: res
		});
	});
};

Auth.fn.setLogger = function(log) {
    this.log = log;
}

function logInvocation(self, method, duration, isSuccess, size, httpStatus) {
    if(self.log) {
        self.log.info({
            api: 'auth',
            method: method,
            duration: duration/1000.0,
            isSuccess: isSuccess,
            isEmulated: false,
            size: size,
            rawSize: size,
            httpStatusCode: httpStatus
        }, method);
    }
}

module.exports = new Auth();
