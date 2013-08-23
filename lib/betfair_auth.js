// (C) 2013 Anton Zemlyanov
// Betfair authorization
// Implements both "interactive" and "bot" auth methods

var https = require('https');
var querystring = require('querystring');
var url = require('url');
var cookie = require('cookie');
var fs = require('fs');
var async = require('async');

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
    }
    var data = querystring.stringify(formData);

    var options = url.parse(interactiveConfig.authHost + interactiveConfig.loginUrl);
    options.method = 'POST';
    options.headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        'Content-Length': data.length
    };
    var startTime = new Date();
    var req = https.request(options, function (res) {
        var endTime = new Date();
        if (res.statusCode != 200) {
            var reason = "Bad HTTP code:" + res.statusCode;
            // if 302, then analyze Location header to privide better reason
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

        // response data is out of interest, we need cookie ssoid
        var setCookie = res.headers['set-cookie'] || [];
        for (var i = 0; i < setCookie.length; ++i) {
            var item = setCookie[i];
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

        cb(null, {duration: endTime - startTime, sessionKey: sessionKey, loginStatus: "SUCCESS", type: "interactive"});
    });
    req.end(data);
}

function interactiveLogout(cb) {
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
            response.duration = stopTime - startTime;
            response.type = "bot";
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

module.exports = {
    interactiveLogin: interactiveLogin,
    botLogin: botLogin
};
