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

function sendErrorResponse(req, res, code, message, ex) {
    var response = {
        jsonrpc:"2.0",
        id: req.id,
        error: { 
            code: code,
            message: message
        }
    };
    if(ex) {
        response.error.exception = ex;
    }
    res.jsonRpcResponseBody = JSON.stringify(response);
    console.log(res.jsonRpcResponseBody);
}

// Emulator is a singleton object
var emulator = module.exports = new Emulator();
