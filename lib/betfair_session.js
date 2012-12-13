//(C) 2012 Anton Zemlyanov

//This module describes Betfair session
//see Sports API documentation on http://bdp.betfair.com

// no login/logout in the new API yet
var v6 = require('betfair-sports-api');
var invocation = require('./betfair_invocation.js');

exports.newSession = newSession;
function newSession() {
    return new BetfairSession();
}

function BetfairSession() {
    var self = this;
}

// expose setCurrentExchange via session
//BetfairSession.prototype.setCurrentExchange = exchangeService.setCurrentExchange;

// Open current session
BetfairSession.prototype.open = function(login, password, appKey, cb) {
    var self = this;
    
    self.login = login;
    self.password = password;
    self.applicationKey = appKey;
    cb = cb || function() {};
    
    invocation.applicationKey = self.applicationKey;

    // Compatibility mode, use old V6 login
    self.v6Session = v6.newSession(login, password);
    self.v6Session.open(function(err,v6res) {
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
BetfairSession.prototype.close = function(cb) {
    var self = this;

    cb = cb || function() {};

    // Compatibility mode, use old V6 login
    self.v6Session.close(function(err, v6res) {
        if (err) {
            cb(err, v6res);
            return;
        }
        self.sessionKey = undefined;
        cb(null, v6res);
    });
}

// list countries
BetfairSession.prototype.listCountries = function(params, cb) {
    var self = this;

    cb = cb || function() {};
    params.filter = params.filter || {};
    var inv = invocation.newInvocation(self.sessionKey,"listCountries", { filter:{}});
    inv.execute( function(err, inv) {
        cb(err, inv);
    });
}
