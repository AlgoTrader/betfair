var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');
var _ = require('lodash');

// Create session to Betfair and start log
var session = common.initialize();

function listMarketCatalogue(cb) {
    console.log('===== Invoke listMarketCatalogue... =====');
    var filter = {eventTypeIds: [2], marketTypeCodes: ['MATCH_ODDS']};
    var what = ['EVENT', 'EVENT_TYPE', 'COMPETITION', 'MARKET_START_TIME'];
    session.listMarketCatalogue({
        filter: filter,
        marketProjection: what,
        maxResults: 1000
    }, function(err, res) {
        console.log("listMarketCatalogue err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err, res);
    });
}

async.series([common.login, listMarketCatalogue, common.logout], function(err, res) {
    console.log("Done, err =", err);
    common.exit(0);
});
