let _ = require('underscore');
let auth = require('./auth.js');
let BetfairInvocation = require('./invocation.js');

// ************************************************************************
// * Accounts API - https://api.betfair.com:443/exchange/account/json-rpc/v1/
// ************************************************************************
const API_ACCOUNT_METHODS = [
    'createDeveloperAppKeys',
    'getDeveloperAppKeys',
    'getAccountDetails',
    'getAccountFunds'
];

class BetfairSession {
    // Constructor
    constructor(applicationKey) {
        this.sessionKey = null;
        this.applicationKey = applicationKey;
        BetfairInvocation.setApplicationKey(applicationKey);

        this.createApiMethods('accounts', API_ACCOUNT_METHODS);
    }

    startInvocationLog() {

    }

    setSslOptions() {

    }

    login(login, password, cb = ()=>{}) {
        auth.loginInteractive(login, password, (err, res) => {
            this.sessionKey = res.sessionKey;
            cb(err, res);
        });
    }

    keepAlive(cb = ()=>{}) {
        auth.keepAlive(this.sessionKey, (err, res) => {
            cb(err, res);
        });
    }

    logout(cb = ()=>{}) {
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
        return function (params, callback = ()=>{}) {
            if(!_.isObject(params)) {
                throw('params should be object');
            }
            var invocation = new BetfairInvocation(api, this.sessionKey, methodName, params);
            invocation.execute(callback);
            return invocation;
        }
    }
}

module.exports = BetfairSession;