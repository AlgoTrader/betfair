// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
// 

function Emulator() {
    var self = this;
    self.markets = {};
}

Emulator.prototype.onListMarketBook = function(result) {
    var self = this;

    if (!result)
        return false;
}

// Process placeOrders API call
Emulator.prototype.handlePlaceOrders = function(req, res, cb) {
    var self = this;
    cb(null, res);
}

// Process replaceOrders API call
Emulator.prototype.handleReplaceOrders = function(req, res, cb) {
    var self = this;
    cb(null, res);
}

// Process updateOrders API call
Emulator.prototype.handleUpdateOrders = function(req, res, cb) {
    var self = this;
    cb(null, res);
}

// Process cancelOrders API call
Emulator.prototype.handleCancelOrders = function(req, res, cb) {
    var self = this;
    cb(null, res);
}

// Emulator is a singleton object
module.exports = new Emulator();
