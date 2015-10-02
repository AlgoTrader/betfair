// This module contains functions shared by multiple tests
var util = require('util');
var fs = require('fs');

// session to use for all the invocations, should be set by test
var settings = exports.settings = {};

settings.sslOptions = {};
var key = fs.existsSync("client-2048.key") && fs.readFileSync("client-2048.key");
var cert = fs.existsSync("client-2048.crt") && fs.readFileSync("client-2048.crt");
if (key && cert) {
    settings.isBotLogin = true;
    settings.sslOptions = { key: key, cert: cert};
}
//console.log(settings);

// login to Betfair
exports.login = function (cb) {
	cb = cb || function() {};

	console.log('===== Logging in to Betfair (' + (settings.isBotLogin ? 'bot' : 'interactive') + ') =====');
    var session = settings.session;
	session.setSslOptions(settings.sslOptions);
    session.login(settings.login, settings.password, function (err, res) {
        if (err) {
            console.log('Login error', err);
			cb(err);
			return;
        }

        console.log('Login OK, %s secs', res.duration / 1000);
        cb(null);
    });
}

// logout from Betfair
exports.logout = function (cb) {
	cb = cb || function() {};

    console.log('===== Logging out... =====');
    var session = settings.session;
    session.logout(function (err, res) {
        if (err) {
            console.log('Logout error', err);
			cb(err);
			return;
        }

        console.log('Logout OK, %s secs', res.duration / 1000, res);
        cb(null);
    });
}

// keepAlive
exports.keepAlive = function (cb) {
	cb = cb || function() {};

	console.log('===== Sending keepAlive ... =====');
	var session = settings.session;
	session.keepAlive(function (err, res) {
		if (err) {
			console.log('KeepAlive error', err);
			cb(err);
			return;
		}

		console.log('keepAlive OK, %s secs', res.duration / 1000, res);
		cb(null);
	});
}

// getDeveloperAppKeys
exports.getDeveloperAppKeys = function (cb) {
	cb = cb || function() {};

	console.log('===== Getting Application Keys... =====');
	var session = settings.session;
	session.getDeveloperAppKeys({}, function (err, res) {
		if (err) {
			console.log('Failed to get a key', err);
			cb(err);
			return;
		}
		//console.log(util.inspect(res.response, {depth:10}));
		var keys = {};
		var app = res.response.result[0];
		for(var cnt=0; cnt<app.appVersions.length; ++cnt) {
			var version = app.appVersions[cnt];
			if(version.delayData) {
				keys.delayed = version.applicationKey;
			} else {
				keys.active = version.applicationKey;
			}
		}
		session.setApplicationKey(keys.active);
		cb(null);
	});
}
// list market catalogue
exports.listMarketCatalogue = function (cb) {
    // Tennis, MATCH ODDS
    console.log('===== calling listMarketCatalogue... =====');
    var session = settings.session;
    var filter = { eventTypeIds: [2], marketTypeCodes: ['MATCH_ODDS']};
    var what = ['EVENT', 'EVENT_TYPE', 'COMPETITION', 'MARKET_START_TIME', 'RUNNER_DESCRIPTION'];
    session.listMarketCatalogue({filter: filter, marketProjection: what, maxResults: 1000}, function (err, res) {
        console.log("listMarketCatalogue err=%s duration=%s", err, res.duration / 1000);
		console.log(util.inspect(res.response, {depth:10}));
        console.log("There are %d markets", res.response.result.length);
        //console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        //console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
		settings.markets = res.response.result;
        cb(err);
    });
}

// select the most far market from the markets array
exports.selectMarket = function (cb) {
    console.log('===== select the market... =====');
	var session = settings.session;
    if (settings.markets.length < 1) {
        throw new Error('No markets to test');
    }
	settings.selectedMarket = settings.markets[settings.markets.length - 1];
    console.log('Selected Market marketId="%s", name="%s"',
		settings.selectedMarket.marketId, settings.selectedMarket.event.name);
    cb(null);
}
