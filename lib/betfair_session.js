//(C) 2013 Anton Zemlyanov

//This module describes Betfair session
//see Sports API documentation on http://bdp.betfair.com

// no login/logout in the new API yet
var v6 = require('betfair-sports-api');
var invocation = require('./betfair_invocation.js');
var auth = require('./betfair_auth.js');
var BetfairInvocation = invocation.BetfairInvocation;

var emulator = require('./emulator.js');

function BetfairSession(activeKey, delayedKey) {
    var self = this;
    self.marketEmulationModes = {};
    invocation.setApplicationKeys(activeKey, delayedKey);
}

// ************************************************************************
// * Invocations log
// ************************************************************************
BetfairSession.prototype.startInvocationLog = function(filename, level) {
    level = level || 'info';
    invocation.startInvocationLog(filename, level);
}

BetfairSession.prototype.stopInvocationLog = function() {
    invocation.stopInvocationLog();
}

// ************************************************************************
// * Emulator stuff
// ************************************************************************

// Enable emulator for market
BetfairSession.prototype.enableBetEmulatorForMarket = function(marketId) {
    emulator.enableBetEmulatorForMarket(marketId);
}

// Disable emulator for market
BetfairSession.prototype.disableBetEmulatorForMarket = function(marketId) {
    emulator.disableBetEmulatorForMarket(marketId);
}

// Emulator status for market
BetfairSession.prototype.isMarketUsingBetEmulator = function(marketId) {
    return emulator.isMarketUsingBetEmulator(marketId);
}

BetfairSession.prototype.startEmulatorLog = function(streams) {
    emulator.startEmulatorLog(streams);
}

BetfairSession.prototype.stopEmulatorLog = function() {
    emulator.stopEmulatorLog();
}

// ************************************************************************
// * Login stuff
// ************************************************************************

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

// Open session using interactive login
BetfairSession.prototype.interactiveLogin = function (login, password, cb) {
    var self = this;

    self.login = login;
    self.password = password;
    cb = cb || function () {
    };
    
    console.log('start interactiveLogin');
    auth.interactiveLogin(login, password, function(err, res) {
        self.sessionKey = res;
        console.log('interactive session key is', self.sessionKey);
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

// ************************************************************************
// * Accounts API - https://beta-api.betfair.com/account/json-rpc
// ************************************************************************
// create keys
BetfairSession.prototype.createDeveloperAppKeys = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var inv = new BetfairInvocation("accounts", self.sessionKey, "createDeveloperAppKeys", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// get keys (just a reminder)
BetfairSession.prototype.getDeveloperAppKeys = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var inv = new BetfairInvocation("accounts", self.sessionKey, "getDeveloperAppKeys", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}


// ************************************************************************
// * Sports (Betting) API - https://beta-api.betfair.com/betting/json-rpc
// ************************************************************************

// list competitions
BetfairSession.prototype.listCompetitions = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    params.filter = params.filter || {};
    var inv = new BetfairInvocation("sports", self.sessionKey, "listCompetitions", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listCountries", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listEvents", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listEventTypes", params);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

// listMarketBook
BetfairSession.prototype.listMarketBook = function (params, cb) {
    var self = this;

    cb = cb || function () {
    };
    var inv = new BetfairInvocation("sports", self.sessionKey, "listMarketBook", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listMarketCatalogue", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listMarketTypes", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listTimeRanges", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "listVenues", params);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "placeOrders", params, isEmulated);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "replaceOrders", params, isEmulated);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "updateOrders", params, isEmulated);
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
    var inv = new BetfairInvocation("sports", self.sessionKey, "cancelOrders", params, isEmulated);
    inv.execute(function (err, inv) {
        cb(err, inv);
    });
}

module.exports = BetfairSession;
