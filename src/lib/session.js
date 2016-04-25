// (C) 2016 Anton Zemlyanov, rewritten in JavaScript 6 (ES6)
'use strict';

let _ = require('underscore');
let auth = require('./auth.js');
let BetfairInvocation = require('./invocation.js');

// ************************************************************************
// * Betting API - https://api.betfair.com:443/exchange/betting/json-rpc/v1/
// ************************************************************************
const API_BETTING_METHODS = [
    // read-only
    'listEventTypes',
    'listCompetitions',
    'listTimeRanges',
    'listEvents',
    'listMarketTypes',
    'listCountries',
    'listVenues',
    'listMarketCatalogue',
    'listMarketBook',
    'listMarketProfitAndLoss',
    'listCurrentOrders',
    'listClearedOrders',
    // transactional
    'placeOrders',
    'cancelOrders',
    'replaceOrders',
    'updateOrders'
];

// ************************************************************************
// * Accounts API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
const API_ACCOUNT_METHODS = [
    'createDeveloperAppKeys',
    'getAccountDetails',
    'getAccountFunds',
    'getDeveloperAppKeys',
    'getAccountStatement',
    'listCurrencyRates',
    'transferFunds'
];

// ************************************************************************
// * Heartbeat API - https://api.betfair.com:443/exchange/betting/json-rpc/v1/
// ************************************************************************
const API_HEARTBEAT_METHODS = [
    'heartbeat'
];

// ************************************************************************
// * Scores API - https://api.betfair.com:443/exchange/scores/json-rpc/v1/
// ************************************************************************
const API_SCORES_METHODS = [
    'listRaceDetails',
    'listScores',
    'listIncidents',
    'listAvailableEvents'
];

class BetfairSession {
    // Constructor
    constructor(applicationKey) {
        this.sessionKey = null;
        this.applicationKey = applicationKey;
        BetfairInvocation.setApplicationKey(applicationKey);

        this.createApiMethods('betting', API_BETTING_METHODS);
        this.createApiMethods('accounts', API_ACCOUNT_METHODS);
        this.createApiMethods('heartbeat', API_HEARTBEAT_METHODS);
        this.createApiMethods('scores', API_SCORES_METHODS);
    }

    startInvocationLog(logger) {
        auth.startInvocationLog(logger);
        BetfairInvocation.startInvocationLog(logger);
    }

    stopInvocationLog() {
        auth.stopInvocationLog();
        BetfairInvocation.stopInvocationLog();
    }

    setSslOptions() {
        // TODO, bot login is not supported yet
    }

    login(login, password, cb = ()=> {}) {
        auth.loginInteractive(login, password, (err, res) => {
            if (err) {
                cb(err);
                return;
            }
            this.sessionKey = res.sessionKey;
            cb(null, res);
        });
    }

    keepAlive(cb = ()=> {}) {
        auth.keepAlive(this.sessionKey, (err, res) => {
            cb(err, res);
        });
    }

    logout(cb = ()=> {}) {
        auth.logout(this.sessionKey, (err, res) => {
            cb(err, res);
        });
    }

    // Create multiple Betfair API calls (account API, bettint api, etc)
    createApiMethods(api, methods) {
        methods.forEach((method) => {
            BetfairSession.prototype[method] = this.createMethod(api, method);
        })
    }

    // Arbitrary Betfair API RPC call constructor
    createMethod(api, methodName) {
        return function(params, callback = ()=> {}) {
            if (!_.isObject(params)) {
                throw('params should be object');
            }
            let invocation = new BetfairInvocation(api, this.sessionKey, methodName, params);
            invocation.execute((err, result) => {
                //console.log(methodName, 'error', err, 'result', result);
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, result);
            });
            return invocation;
        }
    }
}

module.exports = BetfairSession;