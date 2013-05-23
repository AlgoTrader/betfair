// (C) 2013 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 
// The emulator service emulates HTTP behavior
// it gets "HTTP" JSON requests and sends "HTTP" JSON responses

var util = require('util');
var events = require('events');
var Stream = require('stream');

var core = require('./emulator_core');

// http request function emulation
exports.request = request;

// emulator control interface
exports.enableBetEmulatorForMarket = function(marketId) {
    core.enableBetEmulatorForMarket(marketId,isEnabled);
};

exports.disableBetEmulatorForMarket = function(marketId) {
    core.disableBetEmulatorForMarket(marketId,isEnabled);
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

    // Parse JSON
    var req;
    try {
        JSON.parse(self.jsonRpcRequestBody);
    } catch(e) {
        var res = {jsonrpc:"2.0", id:null, error: {code: -32700, message: "Parse Error"}};
        self.response.jsonRpcRequestBody = JSON.stringify(res);
        self.response.send();
        return;
    }
    
    // handle JSON RPC request
    self.method = req.method;
    switch (self.method) {
    case 'placeOrders':
        core.handlePlaceOrders(self, self.response, function(err, res) {
            self.response.send();
        });
        break;
    case 'replaceOrders':
        core.handleReplaceOrders(self, self.response, function(err, res) {
            self.response.send();
        });
        break;
    case 'updateOrders':
        core.handleUpdateOrders(self, self.response, function(err, res) {
            self.response.send();
        });
        break;
    case 'cancelOrders':
        core.handleCancelOrders(self, self.response, function(err, res) {
            self.response.send();
        });
        break;
    case 'listCurrentOrders':
        core.handleListCurrentOrders(self, self.response, function(err, res) {
            self.response.send();
        });
        break;
    default:
        var res = {jsonrpc:"2.0", id:req.id, error: {code: -32601, message: "Method not found"}};
        self.response.jsonRpcRequestBody = JSON.stringify(res);
        self.response.send();
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

EmulatorResponse.prototype.send = function()
{
    var self = this;
    
    self.emit('data', new Buffer(self.jsonRpcResponseBody,'utf-8'));
    self.emit('end');
}
