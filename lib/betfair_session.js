//(C) 2012 Anton Zemlyanov

//This module describes Betfair session
//see Sports API documentation on http://bdp.betfair.com

// no login/logout in the new API yet
var v6 = require('betfair-sports-api');
var invocation = require('./betfair_invocation.js');

exports.newSession = newSession;
function newSession(appKey) {
    return new BetfairSession(appKey);
}

function BetfairSession(appKey) {
    var self = this;
    self.marketEmulationModes = {};
    invocation.setApplicationKey(appKey);
}

// Set emulator mode for market
BetfairSession.prototype.setMarketEmulationMode = function(marketId, isEmulated) {
    var self = this;
    self.marketEmulationModes[marketId] = (isEmulated ? true : false);
}

// Get emulator mode for market
BetfairSession.prototype.getMarketEmulationMode = function(marketId) {
    var self = this;
    var isEmulated = self.marketEmulationModes[marketId];
    return (isEmulated ? true : false);
}

// Open current session
BetfairSession.prototype.login = function (login, password, cb) {
    var self = this;

    self.login = login;
    self.password = password;
    cb = cb || function () {
    };

    // Compatibility mode, use old V6 login
    self.v6Session = v6.newSession(login, password);
    self.v6Session.open(function (err, v6res) {
        if (err) {
            cb(err, v6res);
            return;
        }
        if (v6res.result.errorCode !== "OK") {
            cb(inv.result.errorCode, inv);
            return;
        }
        self.sessionKey = v6res.result.header.sessionToken;
        cb(null, v6res);
    });
}

// Close current session
BetfairSession.prototype.logout = function (cb) {
    var self = this;

    cb = cb || function () {
    };

    // Compatibility mode, use old V6 login
    self.v6Session.close(function (err, v6res) {
        if (err) {
            cb(err, v6res);
            return;
        }
        self.sessionKey = undefined;
        cb(null, v6res);
    });
}

// list competitions
BetfairSession.prototype.listCompetitions = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listCompetitions", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// list countries
BetfairSession.prototype.listCountries = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listCountries", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// list events
BetfairSession.prototype.listEvents = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listEvents", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// list event types
BetfairSession.prototype.listEventTypes = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listEventTypes", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listMarketBook
BetfairSession.prototype.listMarketBook = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var inv = invocation.newInvocation(self.sessionKey, "listMarketBook", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listMarketCatalogue
BetfairSession.prototype.listMarketCatalogue = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    params.marketProjection = params.marketProjection || ['EVENT', 'EVENT_TYPE',
                                                          'MARKET_DESCRIPTION', 'RUNNER_DESCRIPTION'
    ];
    params.sort = params.sort || 'FIRST_TO_START';
    params.maxResults = params.maxResults || 100;
    var inv = invocation.newInvocation(self.sessionKey, "listMarketCatalogue", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listMarketTypes
BetfairSession.prototype.listMarketTypes = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listMarketTypes", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listTimeRanges
BetfairSession.prototype.listTimeRanges = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listTimeRanges", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listVenues
BetfairSession.prototype.listVenues = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey, "listVenues", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

