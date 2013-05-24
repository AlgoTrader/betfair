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

var core = require('./emulator_core');

var networkDelay = 20; // 20ms, every API call is delayed this time
var bettingDelay = 100; // 100ms caused by Malta roundtrip

core.betingDelay = bettingDelay;

// http request function emulation
exports.request = request;

// emulator control interface
exports.enableBetEmulatorForMarket = function(marketId) {
    core.enableBetEmulatorForMarket(marketId);
};

exports.disableBetEmulatorForMarket = function(marketId) {
    core.disableBetEmulatorForMarket(marketId);
};

exports.isMarketUsingBetEmulator = function(marketId) {
    return core.isMarketUsingBetEmulator(marketId);
};

// listMarketBook is used to provide to emulator prices/traded volumes
// emulator returns matched/unmatched bets
exports.onListMarketBook = function (result) {
    return core.onListMarketBook(result);
};

function request(httpOptions, response) {
    var req = new EmulatorRequest(httpOptions);
    var res = new EmulatorResponse();

    // cross link request and response 
    req.response = res;
    res.request = req;
    
    // Betfair now has UUID for every server request
    var reqUuid = uuid.v1();
    req.uuid = reqUuid;
    res.uuid = reqUuid;

    response(res);
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
EmulatorRequest.prototype.write = function(data) {
    var self = this;
    self.jsonRpcRequestBody += data;
}

// end
EmulatorRequest.prototype.end = function() {
    var self = this;
    
    // Send response function
    // adds network delay before sending JSON-RPC response
    function sendResponse() {
        setTimeout(function() {
            self.response.sendResponse();
        }, networkDelay);
    }

    // Parse JSON
    var req;
    try {
        req = JSON.parse(self.jsonRpcRequestBody);
    } catch(e) {
        core.handleBadRequest(self, self.response, function(err, res) {
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
    
    switch (self.method) {
    case 'placeOrders':
        core.placeOrders(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
    case 'replaceOrders':
        core.replaceOrders(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
    case 'updateOrders':
        core.updateOrders(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
    case 'cancelOrders':
        core.cancelOrders(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
    case 'listCurrentOrders':
        core.listCurrentOrders(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
    default:
        core.handleUnknownMethod(self, self.response, function(err, res) {
            sendResponse();
        });
        break;
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

EmulatorResponse.prototype.sendResponse = function()
{
    var self = this;
    
    var response = {
        jsonrpc: "2.0",
        id: self.id,
    };
    if(self.result) {
        response.result = self.result;
    } else if(self.error) {
        response.error = self.error;
    } else {
        response.error = {code:-32602, message:"DSC-018" };
    }
    
    self.jsonRpcResponseBody = JSON.stringify(response);
    
    self.emit('data', new Buffer(self.jsonRpcResponseBody,'utf-8'));
    self.emit('end');
}
