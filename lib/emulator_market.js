// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
//

var emulator = require('./emulator.js');

function EmulatorMarket(marketId) {
    var self = this;
    self.marketId = marketId;
    self.isInitialized = false;
    self.players = {};
}

EmulatorMarket.prototype.onListMarketBook = function (rec) {
    var self = this;
    var log = emulator.log;

    log && log.info("Market: onListMarketBook for marketId=" + rec.marketId);
    self.bookRecord = rec;

    var p1 = self.bookRecord.runners[0];
    var p2 = self.bookRecord.runners[1];
    self.players[p1.selectionId] = p1;
    self.players[p2.selectionId] = p2;

    if (!self.isInitialized) {
        log && log.info("Market: market is initialized");
    }
    self.isInitialized = true;
}

// Process placeOrders API call
EmulatorMarket.prototype.placeOrders = function (req, res, cb) {
    var self = this;
    var log = emulator.log;

    log && log.info("Market: placeOrders");

    // prepare error response
    var result = {
        customerRef: req.params.customerRef, // optional
        status: "FAILURE",
        errorCode: "BET_ACTION_ERROR",
        marketId: self.marketId,
        instructionReports: []
    };
    var instructions = req.params.instructions;
    for (var i = 0; i < instructions.length; ++i) {
        var inst = instructions[i];
        var rep = {
            status: "FAILURE",
            errorCode: "ERROR_IN_ORDER",
            instruction: inst
        };
        result.instructionReports.push(rep);
    }
    // reply with error if market not yet initialized
    if (!self.isInitialized) {
        self.emulator.sendResponse(res, result);
        cb(null);
        return;
    }

    // check instructions
    for (var i = 0; i < instructions.length; ++i) {
        var inst = instructions[i];
        // check order
        if (!inst.order || inst.order !== 'LIMIT') {
            self.emulator.sendErrorResponse(res, -32602, "DSC-018");
            cb(null);
            return;
        }
        // check selectionId
        var selId = inst.selectionId;
        var player = self.players[selId];
        if (!player) {
            result.status = "INVALID_RUNNER";
            self.emulator.sendResponse(res, result);
            cb(null);
            return;
        }
    }

    // is duplicate
    var dup = isDuplicate(self, req);

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process replaceOrders API call
EmulatorMarket.prototype.replaceOrders = function (req, res, cb) {
    var self = this;
    var log = emulator.log;

    // check marketId
    var marketId = req.params.marketId;
    if (!self.isMarketUsingBetEmulator(marketId)) {
        var ex = {
            "errorDetails": "market id passed is invalid",
            "errorCode": "INVALID_INPUT_DATA"
        };
        sendExceptionResponse(req, res, -32099, "ANGX-0002", ex);
        cb(null);
        return;
    }

    // is duplicate
    var dup = isDuplicate(self, req);

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process updateOrders API call
EmulatorMarket.prototype.updateOrders = function (req, res, cb) {
    var self = this;
    var log = emulator.log;

    // check marketId
    var marketId = req.params.marketId;
    if (!self.isMarketUsingBetEmulator(marketId)) {
        var ex = {
            "errorDetails": "market id passed is invalid",
            "errorCode": "INVALID_INPUT_DATA"
        };
        sendExceptionResponse(req, res, -32099, "ANGX-0002", ex);
        cb(null);
        return;
    }

    // is duplicate
    var dup = isDuplicate(self, req);

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

// Process cancelOrders API call
EmulatorMarket.prototype.cancelOrders = function (req, res, cb) {
    var self = this;
    var log = emulator.log;

    // check marketId
    var marketId = req.params.marketId;
    if (!self.isMarketUsingBetEmulator(marketId)) {
        var ex = {
            "errorDetails": "market id passed is invalid",
            "errorCode": "INVALID_INPUT_DATA"
        };
        sendExceptionResponse(req, res, -32099, "ANGX-0002", ex);
        cb(null);
        return;
    }

    // is duplicate
    var dup = isDuplicate(self, req);

    sendErrorResponse(req, res, -32602, "DSC-018");
    cb(null);
}

function isDuplicate(self, req) {
    var ref = req.params.customerRef;
    if (!ref)
        return false;
    var isDup = self.customerRefs[ref] ? true : false;
    self.customerRefs[ref] = true;
    return isDup;
}

// Emulator is a singleton object
module.exports = EmulatorMarket;
