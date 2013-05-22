// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY']|| "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

function listMarketBook(data, cb) {
    if(!cb) 
        cb = data;

    //var price = ['EX_ALL_OFFERS'];
    var price = ['EX_ALL_OFFERS', 'EX_TRADED'];
    var order = 'ALL';
    var match = 'NO_ROLLUP';
    var req = {
        marketIds:[data.selectedMarket.marketId],
        matchProjection: 'NO_ROLLUP',
        priceProjection: {priceData: ['EX_ALL_OFFERS', 'EX_TRADED']}
    };
    session.listMarketBook(req, function(err,res) {
        console.log("listMarketBook err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err,data);
    });
}

async.waterfall([common.login, common.listMarketCatalogue, common.selectMarket, 
    listMarketBook, common.logout], function(err,res) {
    console.log("Done, err =",err);
    process.exit(0);
});
