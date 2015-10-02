//(C) 2013 Anton Zemlyanov

//This module describes Betfair session
//see Sports API documentation on http://bdp.betfair.com

// no login/logout in the new API yet
//var v6 = require('betfair-sports-api');
var invocation = require('./betfair_invocation.js');
var auth = require('./betfair_auth.js');
var BetfairInvocation = invocation.BetfairInvocation;
var util = require('util');
var bunyan = require('bunyan');

var emulator = require('betfair-emulator');

function BetfairSession(key, options) {
	var self = this;
	self.marketEmulationModes = {};
	self.sslOptions = {};
	
	key && self.setApplicationKey(key);

	if (options && typeof(options.gzip) !== 'undefined') {
		invocation.setUseGzipCompression(!!options.gzip);
	}
}

// ************************************************************************
// * Application Keys
// ************************************************************************
BetfairSession.prototype.setApplicationKey = function (key) {
	key = key || "none";
	invocation.setApplicationKey(key);
}

// ************************************************************************
// * Invocations log
// ************************************************************************
BetfairSession.prototype.startInvocationLog = function (streams) {
    // force streams to be array
    if (!util.isArray(streams)) {
        streams = [ streams ];
    }
    // start log
    var log = bunyan.createLogger({
        name: 'invocations',
        streams: streams
    });
    
    invocation.setLogger(log);
    auth.setLogger(log);
}

BetfairSession.prototype.stopInvocationLog = function () {
    invocation.setLogger(null);
    auth.setLogger(null);
}

// ************************************************************************
// * Emulator stuff
// ************************************************************************

// Enable emulator for market
BetfairSession.prototype.enableBetEmulatorForMarket = function (marketId) {
	emulator.enableBetEmulatorForMarket(marketId);
}

// Disable emulator for market
BetfairSession.prototype.disableBetEmulatorForMarket = function (marketId) {
	emulator.disableBetEmulatorForMarket(marketId);
}

// Emulator status for market
BetfairSession.prototype.isMarketUsingBetEmulator = function (marketId) {
	return emulator.isMarketUsingBetEmulator(marketId);
}

BetfairSession.prototype.startEmulatorLog = function (streams) {
	emulator.startEmulatorLog(streams);
}

BetfairSession.prototype.stopEmulatorLog = function () {
	emulator.stopEmulatorLog();
}

// ************************************************************************
// * Login stuff
// ************************************************************************

// Open current session
BetfairSession.prototype.setSslOptions = function (sslOptions) {
	var self = this;
	self.sslOptions = sslOptions;
}

// Open current session
BetfairSession.prototype.login = function (login, password, cb) {
	var self = this;

	cb = cb || function () {
	};

	// test login is interactive or bot
	this.loginType = 'interactive';
	if (self.sslOptions.key && self.sslOptions.cert) {
		this.loginType = 'bot';
	}

	self.loginName = login;
	self.password = password;

	function onLoginResult(err, res) {
		if (err) {
			cb(err, res);
			return;
		}
		self.sessionKey = res.sessionKey || "";
		//console.log("key",self.sessionKey);
		cb(err, res);
	}

	switch (this.loginType) {
		case 'interactive':
			auth.interactiveLogin(login, password, onLoginResult);
			break;
		case 'bot':
			auth.botLogin(login, password, self.sslOptions, onLoginResult);
			break;
	}
	return;
}

// Close current session
BetfairSession.prototype.logout = function (cb) {
	var self = this;

	cb = cb || function () {
	};

	auth.logout(self.sessionKey, cb);
}

// Close current session
BetfairSession.prototype.keepAlive = function (cb) {
	var self = this;

	cb = cb || function () {
	};

	auth.keepAlive(self.sessionKey, cb);
}

// ************************************************************************
// * Generic invocation
// ************************************************************************
function createInvocation(api, methodName) {
	return function (params, cb) {
		var self = this;
		cb = cb || function () {
		};
		if(typeof(params)!=='object') {
			throw('No parameters provided for '+methodName);
		}
		var invocation = new BetfairInvocation(api, self.sessionKey, methodName, params);
		invocation.execute(function (err, inv) {
			cb(err, inv);
		});
		return invocation;
	}
}

// ************************************************************************
// * Accounts API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
BetfairSession.prototype.createDeveloperAppKeys = createInvocation("accounts", "createDeveloperAppKeys");
BetfairSession.prototype.getDeveloperAppKeys = createInvocation("accounts", "getDeveloperAppKeys");
BetfairSession.prototype.getAccountDetails = createInvocation("accounts", "getAccountDetails");
BetfairSession.prototype.getAccountFunds = createInvocation("accounts", "getAccountFunds");

// ************************************************************************
// * Sports (Betting) API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
// readonly
BetfairSession.prototype.listCompetitions = createInvocation("betting", "listCompetitions");
BetfairSession.prototype.listCountries = createInvocation("betting", "listCountries");
BetfairSession.prototype.listCurrentOrders = createInvocation("betting", "listCurrentOrders");
BetfairSession.prototype.listClearedOrders = createInvocation("betting", "listClearedOrders");
BetfairSession.prototype.listEvents = createInvocation("betting", "listEvents");
BetfairSession.prototype.listEventTypes = createInvocation("betting", "listEventTypes");
BetfairSession.prototype.listMarketBook = createInvocation("betting", "listMarketBook");
BetfairSession.prototype.listMarketCatalogue = createInvocation("betting", "listMarketCatalogue");
BetfairSession.prototype.listMarketTypes = createInvocation("betting", "listMarketTypes");
BetfairSession.prototype.listTimeRanges = createInvocation("betting", "listTimeRanges");
BetfairSession.prototype.listVenues = createInvocation("betting", "listVenues");

// betting
BetfairSession.prototype.placeOrders = createInvocation("betting", "placeOrders");
BetfairSession.prototype.replaceOrders = createInvocation("betting", "replaceOrders");
BetfairSession.prototype.updateOrders = createInvocation("betting", "updateOrders");
BetfairSession.prototype.cancelOrders = createInvocation("betting", "cancelOrders");

// ************************************************************************
// * Scores API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
BetfairSession.prototype.listScores = createInvocation("scores", "listScores");
BetfairSession.prototype.listIncidents = createInvocation("scores", "listIncidents");
BetfairSession.prototype.listAvailableEvents = createInvocation("scores", "listAvailableEvents");

module.exports = BetfairSession;
