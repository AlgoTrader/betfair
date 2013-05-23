//(C) 2013 Anton Zemlyanov

//This module implements a generic Betfair Sports API invocation (JSON-RPC protocol)
//see Sports API documentation on http://bdp.betfair.com

var url = require('url');
var https = require('https');
var util = require('util');
var events = require('events');
var Stream = require('stream');
var zlib = require('zlib');

var session = require('./betfair_session.js');
var emulator = require('./emulator.js');

// HTTPS persistent connections agent
// requires to have a pool of parallel persitent connections
var ForeverAgentSSL = require('../util/forever.js').SSL;
var foreverAgentSSL = new ForeverAgentSSL({
    maxSockets: 36,
    minSockets: 16
});

// Static invocation configuration options
var config = {
    service: "https://beta-api.betfair.com:443/json-rpc",
    useGzipCompression: true,
    apiType: "SportsAPING",
    apiVersion: "v1.0"
};

// Emulated invocations
// Those invocations can be send either to Betfair or to Emulator
// In case of emulation, listMarketBook
var emulatedInvocations = ['placeOrders', 'updateOrders', 'replaceOrders', 'cancelOrders'];

var applicationKey = null;
var jsonRpcId = 1;

function BetfairInvocation(sessionKey, method, params, isEmulated) {
    var self = this;

    // input params
    self.sessionKey = sessionKey;
    self.method = method;
    self.params = params || {};
    self.isEmulated = isEmulated || false;

    // Stream stuff, BetfairInvocation is writable stream
    self.readable = false;
    self.writable = true;

    // Request and Response stuff
    self.service = config.service;
    self.request = {
        "jsonrpc": "2.0",
        "id": jsonRpcId++,
        "method": config.apiType + '/' + config.apiVersion + '/' + self.method,
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
    self.callback = callback || function () {
    };

    var parsedUrl = url.parse(self.service);
    var httpOptions = {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
        agent: foreverAgentSSL,
        forever: true,
        headers: {
            'X-Application': applicationKey,
            'X-Authentication': '"' + self.sessionKey + '"',
            'Content-Type': 'application/json',
            'Content-Length': self.jsonRequestBody.length,
            'Connection': 'keep-alive'
        }
    };
    // Optional GZIP compression
    if (config.useGzipCompression)
        httpOptions.headers['Accept-Encoding'] = 'gzip';

    function responseCallback(res) {
        //console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
        self.statusCode = res.statusCode;

        // just for stats
        res.on('data', function (data) {
            self.rawResponseLength += data.length;
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

    // issue HTTPS invocation
    var req = https.request(httpOptions, responseCallback);

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

    try {
        self.response = JSON.parse(self.jsonResponseBody);
    } catch (err) {
        self.response = { error: "Got bad JSON from server" };
    }
    self.finishDate = new Date;

    self.isSuccess = ((self.response && self.response.result) ? true : false);
    self.duration = self.finishDate - self.startDate;

    if (self.isSuccess) {
        self.callback(null, self);
    } else {
        self.callback(self.response.error, self);
    }
};

// Exports
exports.BetfairInvocation = BetfairInvocation;
exports.setApplicationKey = function (key) {
    applicationKey = key;
};
