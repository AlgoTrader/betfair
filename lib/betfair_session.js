//(C) 2013 Anton Zemlyanov

//This module describes Betfair session
//see Sports API documentation on http://bdp.betfair.com

// no login/logout in the new API yet
var v6 = require('betfair-sports-api');
var invocation = require('./betfair_invocation.js');
var BetfairInvocation = invocation.BetfairInvocation;

var emulator = require('./emulator.js');

function BetfairSession(appKey) {
    var self = this;
    self.marketEmulationModes = {};
    invocation.setApplicationKey(appKey);
}

// Enable emulator for market
BetfairSession.prototype.enableBetEmulatorForMarket = function(marketId) {
    emulator.enableBetEmulatorForMarket(marketId);
}

// Disable emulator for market
BetfairSession.prototype.disableBetEmulatorForMarket = function(marketId) {
    emulator.disableBetEmulatorForMarket(marketId);
}

// Disable emulator for market
BetfairSession.prototype.isMarketUsingBetEmulator = function(marketId) {
    return emulator.isMarketUsingBetEmulator(marketId);
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
    var inv = new BetfairInvocation(self.sessionKey, "listCompetitions", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listCountries", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listEvents", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listEventTypes", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listMarketBook
BetfairSession.prototype.listMarketBook = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var inv = new BetfairInvocation(self.sessionKey, "listMarketBook", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listMarketCatalogue", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listMarketTypes", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listTimeRanges", params);
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
    var inv = new BetfairInvocation(self.sessionKey, "listVenues", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// placeOrders
BetfairSession.prototype.placeOrders = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var isEmulated = self.isMarketUsingBetEmulator(params.marketId);
    var inv = new BetfairInvocation(self.sessionKey, "placeOrders", params, isEmulated);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// replaceOrders
BetfairSession.prototype.replaceOrders = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var isEmulated = self.isMarketUsingBetEmulator(params.marketId);
    var inv = new BetfairInvocation(self.sessionKey, "replaceOrders", params, isEmulated);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// updateOrders
BetfairSession.prototype.updateOrders = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var isEmulated = self.isMarketUsingBetEmulator(params.marketId);
    var inv = new BetfairInvocation(self.sessionKey, "updateOrders", params, isEmulated);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// cancelOrders
BetfairSession.prototype.cancelOrders = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var isEmulated = self.isMarketUsingBetEmulator(params.marketId);
    var inv = new BetfairInvocation(self.sessionKey, "cancelOrders", params, isEmulated);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

module.exports = BetfairSession;
