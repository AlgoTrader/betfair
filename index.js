// (C) 2012 Anton Zemlyanov
//
// Betfair Sports API for node
// see Sports API documentation on http://bdp.betfair.com
//
// Exported properties:
//   newSession  - create Betfair Session

var betfairSession = require('./lib/betfair_session');
exports.newSession  = betfairSession.newSession;

var betfairPrice = require('./lib/betfair_price');
exports.newBetfairPrice = betfairPrice.newBetfairPrice;

