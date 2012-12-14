// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY']|| "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

// list market catalogue
function listMarketCatalogue(data, cb) {
    if(!cb) 
        cb = data;
                
    var filter = { eventTypeIds: [1], marketTypeCodes:['MATCH_ODDS']};
    var what = ['EVENT', 'RUNNER_DESCRIPTION'];
    session.listMarketCatalogue({filter:filter, marketProjection:what, maxResults:60}, function(err,res) {
        console.log("listMarketCatalogue err=%s duration=%s", err, res.duration()/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        data.selectedMarket = res.response.result[0];
        cb(err,data);
    });
}

function listMarketBook(data, cb) {
    if(!cb) 
        cb = data;

    //var price = ['EX_ALL_OFFERS'];
    var price = ['EX_ALL_OFFERS', 'EX_TRADED'];
    session.listMarketBook({marketIds:[data.selectedMarket.marketId], priceProjection:price}, function(err,res) {
        console.log("listMarketBook err=%s duration=%s", err, res.duration()/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err,data);
    });
}

async.waterfall([common.login, listMarketCatalogue, listMarketBook, common.logout], function(err,res) {
    console.log("Done, err =",err);
    process.exit(0);
});
