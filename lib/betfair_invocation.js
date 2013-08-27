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

var session = require('./betfair_session.js');
var emulator = require('./emulator.js');

// HTTPS persistent connections agent
// requires to have a pool of parallel persitent connections
var ForeverAgentSSL = require('../util/forever.js').SSL;
var foreverAgentSSL = new ForeverAgentSSL({
    maxSockets: 36,
    minSockets: 16
});

// Endpoints
var apiTypes = {
    accounts: {type: "AccountAPING", version: "v1.0", service: "https://api.betfair.com:443/exchange/account/json-rpc/v1/"},
    sports: {type: "SportsAPING", version: "v1.0", service: "https://api.betfair.com:443/exchange/betting/json-rpc/v1/"},
};

// Emulated invocations
// Those invocations can be send either to Betfair or to Emulator
var emulatedInvocations = ['placeOrders', 'updateOrders',
    'replaceOrders', 'cancelOrders', 'listCurrentOrders'];

var useGzipCompression = true;

// application keys
var applicationKeys = {
    active: null,
    delayed: null
}

// jsonRpcId, incremented after each call
var jsonRpcId = 1;

// logging stuff
var log = null;
exports.startInvocationLog = function (streams) {
    // force streams to be array
    if (!util.isArray(streams)) {
        streams = [ streams ];
    }

    // rename all the existing logs
    streams.forEach(function (item) {
        // rename old log file if present
        var filename = item.path;
        if (filename && fs.existsSync(filename)) {
            console.log(filename, fs.existsSync(filename));
            var now = new Date();
            //fs.renameSync(filename, filename+'-'+now.toISOString());
            fs.unlinkSync(filename);
        }
    });
    //console.log(streams);

    // start log
    log = bunyan.createLogger({
        name: 'invocations',
        streams: streams
    });
    log.debug('Invocation log started');
}

exports.stopInvocationLog = function () {
    log.debug('Invocation log stopped');
    log = null;
}

function BetfairInvocation(api, sessionKey, method, params, isEmulated) {
    var self = this;
    console.log(arguments);

    if (api !== "accounts" && api !== "sports") {
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
    self.api = apiTypes[api] || apiTypes['sports'];
    self.applicationKey = self.sessionKey ? applicationKeys.active : applicationKeys.delayed;
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
            'X-Authentication': self.sessionKey,
            'Content-Type': 'application/json',
            'Content-Length': self.jsonRequestBody.length,
            'Connection': 'keep-alive'
        }
    };
	if(self.applicationKey) {
		httpOptions.headers['X-Application'] = self.applicationKey;
	}
    console.log(httpOptions);
    // Optional GZIP compression
    if (useGzipCompression)
        httpOptions.headers['Accept-Encoding'] = 'gzip';
    //console.log(httpOptions);

    function responseCallback(res) {
        console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
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

    // issue HTTPS or Emulator invocation
    var transport = https;
    var isEmulatedCall = emulatedInvocations.indexOf(self.method) >= 0;
    //console.log("emulation:",self.isEmulated, isEmulatedCall);
    if (self.isEmulated && isEmulatedCall) {
        transport = emulator;
    }
    var req = transport.request(httpOptions, responseCallback);

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

	console.log(self.jsonResponseBody);
    try {
        self.response = JSON.parse(self.jsonResponseBody);
    } catch (err) {
        console.log(self.jsonResponseBody);
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
            method: self.method,
            duration: self.duration / 1000,
            isSuccess: self.isSuccess,
            isEmulated: self.isEmulated
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
exports.setApplicationKeys = function (active, delayed) {
    applicationKeys.active = active;
    applicationKeys.delayed = delayed;
};
