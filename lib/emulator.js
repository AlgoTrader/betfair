// (C) 2013 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" JSON requests and sends "HTTP" JSON responses

var util = require('util');
var events = require('events');
var Stream = require('stream');
var uuid = require('node-uuid');
var fs = require('fs');
var bunyan = require('bunyan');

var core = require('./emulator_core');

var networkDelay = 20; // 20ms, every API call is delayed this time
var bettingDelay = 100; // 100ms caused by Malta roundtrip

core.betingDelay = bettingDelay;

// http request function emulation
exports.request = request;

// emulator control interface
exports.enableBetEmulatorForMarket = function (marketId) {
    log && log.info('Emulator: Enable emulator for market:' + marketId);
    core.enableBetEmulatorForMarket(marketId);
};

exports.disableBetEmulatorForMarket = function (marketId) {
    log && log.info('Emulator: Disable emulator for market:' + marketId);
    core.disableBetEmulatorForMarket(marketId);
};

exports.isMarketUsingBetEmulator = function (marketId) {
    return core.isMarketUsingBetEmulator(marketId);
};

var log = exports.log = null;
exports.startEmulatorLog = function (streams) {
    // force streams to be array
    if (!util.isArray(streams)) {
        streams = [ streams ];
    }

    // rename all the existing logs
    streams.forEach(function (item) {
        // rename old log file if present
        var filename = item.path;
        if (filename && fs.existsSync(filename)) {
            var now = new Date();
            fs.renameSync(filename, filename + '-' + now.toISOString());
        }
    });
    //console.log(streams);

    // start log
    log = bunyan.createLogger({
        name: 'emulator',
        streams: streams
    });
    log.debug('Emulator log started');
}

exports.stopEmulatorLog = function () {
    log && log.debug('Emulator log stopped');
    log = null;
}

// listMarketBook is used to provide to emulator prices/traded volumes
// emulator returns matched/unmatched bets
exports.onListMarketBook = function (result) {
    log && log.debug({result: result}, 'Emulator: onListMarketBook');
    return core.onListMarketBook(result);
};

function request(httpOptions, cb) {
    log && log.debug('Emulator: New request for emulator');

    var req = new EmulatorRequest(httpOptions);
    var res = new EmulatorResponse();

    // cross link request and response 
    req.response = res;
    res.request = req;

    // Betfair now has UUID for every server request
    var reqUuid = uuid.v1();
    req.uuid = reqUuid;
    res.uuid = reqUuid;
    log && log.debug('Emulator: Request id:%s', reqUuid);

    cb(res);
    return req;
}

function EmulatorRequest(httpOptions) {
    var self = this;

    // Stream stuff, EmulatorRequest is writable stream
    // We write json request into it, emulator gets it and process
    self.readable = true;
    self.writable = false;

    self.headers = httpOptions.headers;
    self.jsonRpcRequestBody = '';
}
util.inherits(EmulatorRequest, Stream);

// write
EmulatorRequest.prototype.write = function (data) {
    var self = this;
    self.jsonRpcRequestBody += data;
}

// end
EmulatorRequest.prototype.end = function () {
    var self = this;

    // Send response function
    // adds network delay before sending JSON-RPC response
    function sendResponse() {
        setTimeout(function () {
            self.response.sendResponse();
        }, networkDelay);
    }

    // Parse JSON
    var req;
    try {
        req = JSON.parse(self.jsonRpcRequestBody);
    } catch (e) {
        core.handleBadRequest(self, self.response, function (err, res) {
            sendResponse();
        });
        return;
    }

    // handle JSON RPC request
    self.id = req.id;
    self.method = req.method.split('/').pop();
    self.params = req.params;

    self.response.id = self.id;
    self.response.method = self.method;

    var handler = core[self.method];
    if (handler && typeof(handler) === 'function') {
        log && log.debug('Emulator: Call handler for method:' + self.method);
        handler.call(core, self, self.response, function (err, res) {
            sendResponse();
        });
    } else {
        // just error
        sendResponse();
    }
}

function EmulatorResponse() {
    var self = this;

    // Stream stuff, EmulatorResponse is readable stream
    // Emulator sends soap response into it
    self.readable = false;
    self.writable = true;

    self.statusCode = 200; // HTTP OK
    self.headers = {};
    self.jsonRpcResponseBody = '';
}
util.inherits(EmulatorResponse, Stream);

EmulatorResponse.prototype.sendResponse = function () {
    var self = this;

    var response = {
        jsonrpc: "2.0",
        id: self.id,
    };
    if (self.result) {
        self.result.isEmulator = "true";
        response.result = self.result;
    } else if (self.error) {
        self.error.data = self.error.data || {};
        self.error.data.isEmulator = "true";
        response.error = self.error;
    } else {
        response.error = {code: -32602, message: "DSC-018", data: {isEmulator: "true"} };
    }

    self.jsonRpcResponseBody = JSON.stringify(response);

    self.emit('data', new Buffer(self.jsonRpcResponseBody, 'utf-8'));
    self.emit('end');
}
