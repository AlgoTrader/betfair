//(C) 2013 Anton Zemlyanov

//This module implements a generic Betfair Sports API invocation (JSON-RPC protocol)
//see Sports API documentation on http://bdp.betfair.com

var url = require('url');
var https = require('https');
var util = require('util');
var events = require('events');
var Stream = require('stream');
var zlib = require('zlib');
var fs = require('fs');
var bunyan = require('bunyan');
var _ = require('underscore');

var session = require('./betfair_session.js');
var emulator = require('betfair-emulator');

// HTTPS persistent connections agent
// requires to have a pool of parallel persitent connections
//var ForeverAgentSSL = require('../util/forever.js').SSL;
//var ForeverAgentSSL = require('agentkeepalive').HttpsAgent;
//var ForeverAgentSSL = require('keep-alive-agent').Secure;

// Standard node 0.12 Agent with keep-alive
var ForeverAgentSSL = https.Agent;
var foreverAgentSSL = new ForeverAgentSSL({
    keepAlive: true,
    keepAliveMsecs: 1000
});

// Endpoints
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var BF_HOST = 'https://84.20.200.10:443';
//var BF_HOST = 'https://api.betfair.com:443';

var apiTypes = {
    accounts: {type: "AccountAPING", version: "v1.0", service: BF_HOST+"/exchange/account/json-rpc/v1/"},
    betting: {type: "SportsAPING", version: "v1.0", service: BF_HOST+"/exchange/betting/json-rpc/v1/"},
    scores: {type: "ScoresAPING", version: "v1.0", service: BF_HOST+"/exchange/scores/json-rpc/v1/"}
};

// Emulated invocations
// Those invocations can be send either to Betfair or to Emulator
var emulatedInvocations = ['placeOrders', 'updateOrders',
    'replaceOrders', 'cancelOrders', 'listCurrentOrders'];

var useGzipCompression = true;

// application keys
var applicationKey = "none";

// jsonRpcId, incremented after each call
var jsonRpcId = 1;

// logging stuff
var log = null;

function BetfairInvocation(api, sessionKey, method, params, isEmulated) {
    var self = this;

    if (api !== "accounts" && api !== "betting" && api != "scores") {
        throw new Error('Bad api parameter ' + api);
    }

    // input params
    self.sessionKey = sessionKey;
    self.method = method;
    self.params = params || {};
    self.isEmulated = isEmulated || false;

    // Stream stuff, BetfairInvocation is writable stream
    self.readable = false;
    self.writable = true;

    // Request and Response stuff
    self.apiType = api;
    self.api = apiTypes[api] || apiTypes['betting'];
    self.applicationKey = applicationKey;
    self.service = self.api.service;
    self.request = {
        "jsonrpc": "2.0",
        "id": jsonRpcId++,
        "method": self.api.type + '/' + self.api.version + '/' + self.method,
        "params": self.params
    };
    self.response = null;
    self.jsonRequestBody = JSON.stringify(self.request);
    self.jsonResponseBody = "";
    self.rawResponseLength = 0;

    // timestamp
    self.startDate = new Date();
}
util.inherits(BetfairInvocation, Stream);

BetfairInvocation.prototype.execute = function (callback) {
    var self = this;
    self.callback = _.once(callback || function () {
    });

    var parsedUrl = url.parse(self.service);
    var httpOptions = {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
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
    //console.log(httpOptions);
    // Optional GZIP compression
    if (useGzipCompression)
        httpOptions.headers['Accept-Encoding'] = 'gzip';
    //console.log(httpOptions);

    function responseCallback(res) {
        //console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
        self.statusCode = res.statusCode;

        // just for stats
        res.on('data', function (data) {
            self.rawResponseLength += data.length;
        });
        res.on('error', function(err) {
            self.callback(err);
        });

        // http request input to self output
        if (res.headers['content-encoding'] === 'gzip') {
            // piping through gzip
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip).pipe(self);
        } else {
            // piping directly to self
            res.pipe(self);
        }
    }

    // issue HTTPS or Emulator invocation
    var transport = https;
    var isEmulatedCall = emulatedInvocations.indexOf(self.method) >= 0;
    //console.log("emulation:",self.isEmulated, isEmulatedCall);
    if (self.isEmulated && isEmulatedCall) {
        transport = emulator;
    }
    var req = transport.request(httpOptions, responseCallback);
    req.on('error', function(err) {
        self.callback(err);
    });

    // send json data
    req.write(self.jsonRequestBody);
    req.end();
};

BetfairInvocation.prototype.write = function (data) {
    var self = this;
    self.jsonResponseBody += data.toString();
};

BetfairInvocation.prototype.end = function () {
    var self = this;

    // Compression efficiency results
    var ratio = 100.0 - (self.rawResponseLength / self.jsonResponseBody.length) * 100.0;
    ratio = Math.round(ratio);
    //console.log('%s response: raw length=%d, json length=%d, compression=%d%',
    //    self.method, self.rawResponseLength, self.jsonResponseBody.length, ratio);

	//console.log(self.jsonResponseBody);
    try {
        self.response = JSON.parse(self.jsonResponseBody);
    } catch (err) {
        //console.log(self.jsonResponseBody);
        self.response = { error: "Got bad JSON from server" };
    }
    self.finishDate = new Date;

    self.isSuccess = ((self.response && self.response.result) ? true : false);
    self.duration = self.finishDate - self.startDate;

    // listMarketBook post-processing
    // orderProjection and matchedProjection are filled by emulator
    // for all the markets in bet emulation mode
    if (self.method === "listMarketBook" && self.isSuccess) {
        emulator.onListMarketBook(self.response.result);
    }

    // Log the invocation result if log enabled
    if (log) {
        // consise invocation result
        log.info({
            api: self.apiType,
            method: self.method,
            duration: self.duration / 1000,
            isSuccess: self.isSuccess,
            isEmulated: self.isEmulated,
            size: self.jsonResponseBody.length,
            rawSize: self.rawResponseLength,
            httpStatusCode: self.statusCode
        }, self.method);
        
        // full request and response
        log.debug({
            request: self.request,
            response: self.response
        }, self.method);
    }

    // report invocation result
    if (self.isSuccess) {
        self.callback(null, self);
    } else {
        self.callback(self.response.error, self);
    }
};

// Exports
exports.BetfairInvocation = BetfairInvocation;
exports.setApplicationKey = function (key) {
    applicationKey = key || "none";
};
exports.setLogger = function (logger) {
    log = logger;
};
exports.setUseGzipCompression = function(value) {
    useGzipCompression = value;
};