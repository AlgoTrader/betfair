'use stict'

const _ = require('underscore');
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
    scores: {
        type: "ScoresAPING",
        version: "v1.0",
        service: BETFAIR_API_HOST + "/exchange/scores/json-rpc/v1/"
    }
};

// Betfair Exchange JSON-RPC API invocation (excluding Auth stuff)
class BetfairInvocation {
    constructor(api, sessionKey, method, params = {}, isEmulated = false) {
        if (api !== "accounts" && api !== "betting" && api != "scores") {
            throw new Error('Bad api parameter:' + api);
        }

        // input params
        this.api = api;
        this.sessionKey = sessionKey;
        this.method = method;
        this.params = params;
        this.isEmulated = isEmulated;

        // Request and Response stuff
        this.api_endpoint = BETFAIR_API_ENDPOINTS[api] || BETFAIR_API_ENDPOINTS.betting;
        this.applicationKey = applicationKey;
        this.service = self.api.service;
        this.request = {
            "jsonrpc": "2.0",
            "id": jsonRpcId++,
            "method": self.api.type + '/' + self.api.version + '/' + self.method,
            "params": self.params
        };
        self.response = null;
    }

    execute(cb = () => {}) {
        let callback = _.once(cb);

        var httpOptions = {
            agent: foreverAgentSSL,
            //forever: true,
            headers: {
                'X-Authentication': self.sessionKey,
                'Content-Type': 'application/json',
                'Content-Length': self.jsonRequestBody.length,
                'Connection': 'keep-alive'
            }
        };
        if(self.applicationKey) {
            httpOptions.headers['X-Application'] = self.applicationKey;
        }
        HttpRequest.post(this.service, '{}', (err, result) => {
            console.log(err, result);
        });
    }
}