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

var interactiveConfig = {
    authHost: 'https://identitysso.betfair.com:443',
    loginUrl: '/api/login',
    logoutUrl: '/api/logout',
    keepAliveUrl: '/api/keepAlive'
};

var botConfig = {
    authHost: 'https://identitysso-api.betfair.com:443',
    loginUrl: '/api/certlogin',
    logoutUrl: null,
    keepAliveUrl: null
};

/**
 * ***** Interactive login methods *****
 */
function postRequest(formData, uri, headers, cb) {
	var data = querystring.stringify(formData);

	var options = url.parse(uri);
	options.method = 'POST';
	options.headers = {
		"Content-Type": "application/x-www-form-urlencoded",
		'Content-Length': data.length
	};
	for(var key in headers) {
		options.headers[key] = headers[key];
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
	var uri = interactiveConfig.authHost + interactiveConfig.loginUrl;

	postRequest(formData, uri, {}, function (err, res) {
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

function interactiveLogout(sessionKey, cb) {
	cb = cb || function () {
	};

	var formData = {
		product: 'home.betfair.int',
		url: 'https://www.betfair.com/'
	};
	var uri = interactiveConfig.authHost + interactiveConfig.logoutUrl;

	// {'X-Authentication':sessionKey}
	postRequest(formData, uri, {}, function (err, res) {
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

function interactiveKeepAlive(cb) {
}

/**
 * ***** Bot login methods *****
 */
function botLogin(login, password, sslOptions, cb) {
    sslOptions = sslOptions || {};
    cb = cb || function () {
    };

    var formData = {username: login, password: password};
    var data = querystring.stringify(formData);

    var options = url.parse(botConfig.authHost + botConfig.loginUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
        'X-Application': 'test'
    }
    options.key = sslOptions.key;
    options.cert = sslOptions.cert;
    options.agent = new https.Agent(options);

    // read key and cert in parallel
    var startTime = new Date();
    var req = https.request(options, function (res) {
        var stopTime = new Date();

        var responseData = "";
        res.on('data', function (data) {
            responseData += data;
        });
        res.on('end', function () {
            //console.log("request data:",data,"response data", responseData);

            try {
                var response = JSON.parse(responseData);
            } catch (e) {
                var response = {loginStatus: "Got bad JSON from Betfair server"};
            }
			response.type = "bot";
            response.duration = stopTime - startTime;
			response.sessionKey = response.sessionToken;
            if(response.loginStatus==='SUCCESS') {
                cb(null, response) 
            } else {
                cb(response.loginStatus, response);
            }
        });
        res.on('error', function (err) {
            cb(err);
        });
    });

    req.end(data);
}

function botLogout(cb) {
}

function botKeepAlive(cb) {
}

module.exports = {
	// Interative
    interactiveLogin: interactiveLogin,
	interactiveLogout: interactiveLogout,
	interactiveKeepAlive: interactiveKeepAlive,
	// Bot
    botLogin: botLogin,
	botLogout: botLogout,
	botKeepAlive: botKeepAlive
};
