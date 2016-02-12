const _ = require('underscore');
const BetfairInvocation = require('./invocation.js');

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