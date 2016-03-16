// This module contains functions shared by multiple tests
let util = require('util');
let fs = require('fs');
let betfair = require('../index.js');

// session to use for all the invocations, should be set by test
let settings = {};

function initialize() {
	// environment
	settings.appKey = process.env['BF_APP_KEY'] || "key";
	settings.login = process.env['BF_LOGIN'] || "nobody";
	settings.password = process.env['BF_PASSWORD'] || "password";

	// SSL key/certificate
	let key = fs.existsSync("client-2048.key") && fs.readFileSync("client-2048.key");
	let cert = fs.existsSync("client-2048.crt") && fs.readFileSync("client-2048.crt");
	if (key && cert) {
		settings.isBotLogin = true;
		settings.sslOptions = {key: key, cert: cert};
	}

	// create session
	settings.session = new betfair.BetfairSession(settings.appKey);

	let logger = new betfair.Logger('calls', 'INFO');
	logger.addFileLog('log_invocations.txt');
	settings.session.startInvocationLog(logger);

	return settings.session;
}

// login to Betfair
function login(cb) {
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

        console.log('Login OK, %s secs', res.duration / 1000, res);
        cb(null);
    });
}

// logout from Betfair
function logout(cb) {
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
function keepAlive(cb) {
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

// list market catalogue
function listMarketCatalogue(cb) {
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
function selectMarket(cb) {
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

module.exports = {
	settings: settings,
    initialize: initialize,
	login: login,
    keepAlive: keepAlive,
	logout: logout
};
