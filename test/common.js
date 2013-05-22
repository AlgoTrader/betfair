// This module contains functions shared by multiple tests
var util = require('util');

// session to use for all the invocations, should be set by test
exports.session = null;
exports.loginName = null;
exports.password = null;

// login to Betfair
exports.login = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 

    console.log('===== Logging in to Betfair =====');
    var session = exports.session;
    session.login(exports.loginName, exports.password, function(err, res) {
        if (err) {
            console.log('Login error', err);
        } else {
            console.log('Login OK, %s secs', res.duration()/1000);
        }
        exports.loginCookie = res.responseCookie;
        cb(err, {});
    });
}

// logout from Betfair
exports.logout = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 
    
    console.log('===== Logging out... =====');
    var session = exports.session;
    session.logout(function(err, res) {
        if (err) {
            console.log('Logout error', err);
        } else {
            console.log('Logout OK, %s secs', res.duration()/1000);
        }
        cb(err, {});
    });
}

// list market catalogue
exports.listMarketCatalogue = function(par, cb) {
    if(!cb) {
        cb = par;
    }
    
    // Tennis, MATCH ODDS
    console.log('===== calling listMarketCatalogue... =====');
    var session = exports.session;
    var filter = { eventTypeIds: [2], marketTypeCodes:['MATCH_ODDS']};
    var what = ['EVENT', 'EVENT_TYPE', 'COMPETITION', 'MARKET_START_TIME', 'RUNNER_DESCRIPTION'];
    session.listMarketCatalogue({filter:filter, marketProjection:what, maxResults:1000}, function(err,res) {
        console.log("listMarketCatalogue err=%s duration=%s", err, res.duration/1000);
        console.log("There are %d markets", res.response.result.length);
        //console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        //console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        par.markets = res.response.result;
        cb(err, par);
    });
}

// select the most far market from the markets array
exports.selectMarket = function(par, cb) {
    if(!cb) {
        cb = par;
    }
    
    console.log('===== select the market... =====');
    if(par.markets.length<1) {
        throw new Error('No markets to test');
    }
    par.selectedMarket = par.markets[par.markets.length-1];
    console.log('Selected Market marketId="%s", name="%s"', 
        par.selectedMarket.marketId, par.selectedMarket.event.name);
    cb(null, par);
}
