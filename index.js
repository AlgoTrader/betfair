// (C) 2013 Anton Zemlyanov
//
// Betfair Sports API for node
// see Sports API documentation on http://bdp.betfair.com
//

// Export BetfairSession 
// Used to invoke Betfair JSON-RPC methods
var BetfairSession = require('./lib/betfair_session');
exports.newSession = function (appKey, options) {
    return new BetfairSession(appKey, options);
};

// Export BetfairPrice
// Used to "normalize" prices to Betfair allowed values
var BetfairPrice = require('./lib/betfair_price');
exports.newBetfairPrice = function (price) {
    return new BetfairPrice(price);
}

