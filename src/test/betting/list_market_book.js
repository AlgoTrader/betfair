var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');
var _ = require('lodash');

// Create session to Betfair and start log
var session = common.initialize();

function listMarketBook(cb) {
    console.log('===== Invoke listMarketBook... =====');
    var req = {
        marketIds: [common.settings.selectedMarket.marketId],
        matchProjection: 'NO_ROLLUP',
        priceProjection: {priceData: ['EX_ALL_OFFERS', 'EX_TRADED']}
    };
    session.listMarketBook(req, function(err, res) {
        console.log("listMarketBook err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err);
    });
}

async.series([common.login, common.listMarketCatalogue, common.selectMarket,
    listMarketBook, common.logout], function(err, res) {
    console.log("Done, err =", err);
    common.exit(0);
});
