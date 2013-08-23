// (C) 2012 Anton Zemlyanov
//
// Emulator allows test bots for "free" using real price data
//

var emulator = require('./emulator.js');

var util = require('util');
var BetfairPrice = require('./betfair_price.js');

// emulator give "nice-looking" bet ids
var lastBetId = 10000000000;

function EmulatorBet(marketId, orderType, selectionId, side, price, size, persistance) {
    var self = this;

    // check side
    if (side != "LAY" && side != "BACK") {
        throw new Error('Bet should be LAY or BACK');
    }

    // check price
    var roundedPrice = new BetfairPrice(1 * price);
    if (Math.abs(price - roundedPrice) > 0.000001) {
        throw new Error('Bad price ' + price);
    }

    // check persistance
    if (persistence != "LAPSE" && persistence != "PERSIST" && persistence != "MARKET_ON_CLOSE") {
        throw new Error('Bet should be LAPSE, PERSIST or MARKET_ON_CLOSE');
    }

    // id
    self.betId = ++lastBetId;

    // bet properties
    self.marketId = marketId;
    self.selectionId = selectionId;
    self.side = side;
    self.price = price;
    self.originalSize = size;
    self.persistance =

        // current unmatched remainder
        self.size = size;
}

EmulatorBet.prototype.isMatched = function () {
    var self = this;

    // remainder is zero and there are matched portions
    return self.size < 0.001 && self.matchedParts.length > 0;
}

// EmulatorBet
module.exports = EmulatorBet;
