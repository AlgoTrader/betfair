// (C) 2016 Anton Zemlyanov, rewritten in JavaScript 6 (ES6)
'use strict';

const _ = require('lodash');
const HttpRequest = require('./http_request.js');

// BETFAIR API enpoints
const BETFAIR_API_HOST = 'https://84.20.200.10:443';
const BETFAIR_API_ENDPOINTS = {
    accounts: {
        type: "AccountAPING",
        version: "v1.0",
        service: BETFAIR_API_HOST + "/exchange/account/json-rpc/v1/"
    },
    betting: {
        type: "SportsAPING",
        version: "v1.0",
        service: BETFAIR_API_HOST + "/exchange/betting/json-rpc/v1/"
    },
    heartbeat: {
        type: "HeartbeatAPING",
        version: "v1.0",
        service: BETFAIR_API_HOST + "/exchange/heartbeat/json-rpc/v1"
    },
    scores: {
        type: "ScoresAPING",
        version: "v1.0",
        service: BETFAIR_API_HOST + "/exchange/scores/json-rpc/v1/"
    }
};

const ORDER_METHODS = ['placeOrders', 'replaceOrders', 'updateOrders', 'cancelOrders'];

// Betfair Exchange JSON-RPC API invocation (excluding Auth stuff)
class BetfairInvocation {
    static setApplicationKey(appKey) {
        BetfairInvocation.applicationKey = appKey;
    }

    static startInvocationLog(logger) {
        BetfairInvocation.logger = logger;
    }

    static stopInvocationLog() {
        BetfairInvocation.logger = null;
    }

    static setEmulator(emulator) {
        BetfairInvocation.emulator = emulator;
    }

    constructor(api, sessionKey, method, params = {}, isEmulated = false) {
        if (api !== "accounts" && api !== "betting" && api != "heartbeat" && api != "scores") {
            throw new Error('Bad api parameter:' + api);
        }
        //console.log(arguments);

        // input params
        this.api = api;
        this.sessionKey = sessionKey;
        this.method = method;
        this.params = params;
        this.isEmulated = isEmulated;

        // Request and Response stuff
        this.apiEndpoint = BETFAIR_API_ENDPOINTS[api] || BETFAIR_API_ENDPOINTS.betting;
        this.applicationKey = BetfairInvocation.applicationKey;
        this.service = this.apiEndpoint.service;
        this.request = {
            "jsonrpc": "2.0",
            "id": BetfairInvocation.jsonRpcId++,
            "method": this.apiEndpoint.type + '/' + this.apiEndpoint.version + '/' + this.method,
            "params": this.params
        };
        this.response = null;
    }

    _executeEmulatedCall(cb = ()=> {}) {
        let result = {};
        let emulator = BetfairInvocation.emulator;

        let sendResult = (method, error, result, cb = ()=> {}) => {
            // log call
            if (BetfairInvocation.logger) {
                BetfairInvocation.logger.info(method, {
                    api: this.api,
                    duration: result.duration,
                    isSuccess: !(result.responseBody && result.responseBody.error),
                    length: 'n/a',
                    httpStatusCode: 'n/a'
                });
            }

            // report result
            cb(null, {
                request: this.request,
                response: {error: error, result: result}, // TODO place response
                result: result,
                error: error,
                duration: 0
            });
        };

        switch (this.method) {
            case 'placeOrders':
                //console.log('$', this.request.params);
                emulator.placeOrders(this.request.params, (err, result) => {
                    sendResult('placeOrders', err, result, cb);
                });
                break;
            case 'replaceOrders':
                sendResult('replaceOrders', {error: 'not supported'}, cb);
                break;
            case 'updateOrders':
                sendResult('updateOrders', {error: 'not supported'}, cb);
                break;
            case 'cancelOrders':
                emulator.cancelOrders(this.request.params, (err, result) => {
                    sendResult('cancelOrders', err, result, cb);
                });
                break;
        }
    }

    execute(cb = () => {}) {
        // if emulator is enabled, redirect orders methods there
        let emulator = BetfairInvocation.emulator;
        if (emulator && _.indexOf(ORDER_METHODS, this.method) >= 0) {
            let marketId = this.params.marketId;
            let isEmulatedMarket = emulator.isEmulatedMarket(marketId);
            if (isEmulatedMarket) {
                this._executeEmulatedCall(cb);
                return;
            }
        }

        let callback = _.once(cb);
        this.jsonRequestBody = JSON.stringify(this.request);
        var httpOptions = {
            headers: {
                'X-Authentication': this.sessionKey,
                'Content-Type': 'application/json',
                'Content-Length': this.jsonRequestBody.length,
                'Connection': 'keep-alive'
            }
        };
        if (this.applicationKey) {
            httpOptions.headers['X-Application'] = this.applicationKey;
        }

        HttpRequest.post(this.service, this.jsonRequestBody, httpOptions, (err, result) => {
            if (err) {
                callback(err);
                return;
            }
            // provide prices to emulator, updates bets status
            if (emulator && this.method == 'listMarketBook') {
                let res = result.responseBody && result.responseBody.result;
                emulator.onListMarketBook(this.params, res);
            }
            // log invocation
            if (BetfairInvocation.logger) {
                BetfairInvocation.logger.info(this.method, {
                    api: this.api,
                    duration: result.duration,
                    isSuccess: !(result.responseBody && result.responseBody.error),
                    length: result.length,
                    httpStatusCode: result.statusCode
                });
            }
            callback(null, {
                request: this.request,
                response: result.responseBody,
                result: result.responseBody && result.responseBody.result,
                error: result.responseBody && result.responseBody.error,
                duration: result.duration
            });
        });
    }
}

BetfairInvocation.jsonRpcId = 1;

module.exports = BetfairInvocation;