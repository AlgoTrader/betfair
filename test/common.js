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
    console.log('===== Logging in to Betfair (' + (settings.isBotLogin ? 'bot' : 'interactive') + ') =====');
    var session = settings.session;
    session.login(settings.login, settings.password, settings.sslOptions, function (err, res) {
        if (err) {
            console.log('Login error', err);
        } else {
            console.log('Login OK, %s secs', res.duration / 1000);
        }
        //exports.loginCookie = res.responseCookie;
        cb(err);
    });
}

// logout from Betfair
exports.logout = function (cb) {
    console.log('===== Logging out... =====');
    var session = settings.session;
    session.logout(function (err, res) {
        if (err) {
            console.log('Logout error', err);
        } else {
            console.log('Logout OK, %s secs', res.duration / 1000);
        }
        cb(err, {});
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
        console.log("There are %d markets", res.response.result.length);
        //console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        //console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        par.markets = res.response.result;
        cb(err, par);
    });
}

// select the most far market from the markets array
exports.selectMarket = function (cb) {
    console.log('===== select the market... =====');
    if (par.markets.length < 1) {
        throw new Error('No markets to test');
    }
    par.selectedMarket = par.markets[par.markets.length - 1];
    console.log('Selected Market marketId="%s", name="%s"',
        par.selectedMarket.marketId, par.selectedMarket.event.name);
    cb(null, par);
}
