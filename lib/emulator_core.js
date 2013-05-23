// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
//

function Emulator() {
    var self = this;
    self.emulatedMarkets = {};
    self.markets = {};
}

// emulator control interface
Emulator.prototype.enableBetEmulatorForMarket = function(marketId) {
    var self = this;
    self.emulatedMarkets[marketId] = true;
}
    
Emulator.prototype.disableBetEmulatorForMarket = function(marketId) {
    var self = this;
    delete self.emulatedMarkets[marketId];
}
        
Emulator.prototype.isMarketUsingBetEmulator = function(marketId) {
    var self = this;
    return self.emulatedMarkets[marketId] ? true : false;
}

Emulator.prototype.onListMarketBook = function(result) {
    var self = this;

    if (!result)
        return false;
        
    for(var i=0; i<result.length; ++i) {
        var marketItem = result[i];
    }
}

// Process placeOrders API call
Emulator.prototype.handlePlaceOrders = function(req, res, cb) {
    var self = this;
    
    var mId = req.params.marketId;
    if(!self.isMarketUsingBetEmulator(mId)) {
        var ex = {
            "errorDetails": "market id passed is invalid",
            "errorCode": "INVALID_INPUT_DATA"
        };
        sendExceptionResponse(req, res, -32099, "ANGX-0002", ex);
        cb(null);
        return;
    }
    
    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process replaceOrders API call
Emulator.prototype.handleReplaceOrders = function(req, res, cb) {
    var self = this;
    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process updateOrders API call
Emulator.prototype.handleUpdateOrders = function(req, res, cb) {
    var self = this;

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process cancelOrders API call
Emulator.prototype.handleCancelOrders = function(req, res, cb) {
    var self = this;

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Unknown method
Emulator.prototype.handleUnknownMethod = function(req, res, cb) {
    var self = this;

    sendErrorResponse(req, res, -32601, "Method not found");
    cb(null);
}

// Bad request
Emulator.prototype.handleBadRequest = function(req, res, cb) {
    var self = this;

    sendErrorResponse(req, res, -32700, "Parse error");
    cb(null);
}

function sendErrorResponse(req, res, code, message) {
    var response = {
        jsonrpc:"2.0",
        id: req.id,
        error: { 
            code: code,
            message: message,
            data: { isEmulator: "true" }
        }
    };
    res.jsonRpcResponseBody = JSON.stringify(response);
    console.log(res.jsonRpcResponseBody);
}

function sendExceptionResponse(req, res, code, message, exception) {
    exception.requestUUID = req.uuid;
    var response = {
        jsonrpc:"2.0",
        id: req.id,
        error: { 
            code: code,
            message: message,
            data: {
                exceptionname: "APINGException",
                APINGException: exception,
                isEmulator: "true"
            }
        }
    };
    res.jsonRpcResponseBody = JSON.stringify(response);
    console.log(res.jsonRpcResponseBody);
}


// Emulator is a singleton object
var emulator = module.exports = new Emulator();
