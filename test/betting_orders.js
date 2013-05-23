// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY']|| "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

// Optional step to test emulator
function enableEmulator(data, cb) {
    if(!cb) {
        cb = data;
    }
    
    var mId = data.selectedMarket.marketId;
    console.log('===== Enable emulator for marketId=%s... =====', mId);
    session.enableBetEmulatorForMarket(mId);
    cb(null, data);
}

function placeOrders(data, cb) {
    if(!cb) {
        cb = data;
    }
    console.log('===== Invoke placeOrders... =====');
    var market = data.selectedMarket;
    var bets = [
        {
            orderType: 'LIMIT',
            selectionId: market.runners[0].selectionId,
            side: 'LAY',
            limitOrder: {
                price: 1.01,
                size: 5.00,
                persistenceType: 'LAPSE'
            }
        },
        {
            orderType: 'LIMIT',
            selectionId: market.runners[0].selectionId,
            side: 'BACK',
            limitOrder: {
                price: 1000,
                size: 5.00,
                persistenceType: 'LAPSE'
            }
        }
    ];
    var ref = (new Date()).toISOString();
    session.placeOrders({marketId:market.marketId, instructions:bets, customerRef:ref}, function(err,res) {
        console.log("placeOrders err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        data.betIds = result.instructionReports.map( function(i) { return i.betId; });
        cb(err,data);
    });
}

function replaceOrders(data, cb) {
    if(!cb) {
        cb = data;
    }
    
    console.log('===== Invoke replaceOrders... =====');
    var market = data.selectedMarket;
    var bets = [
        {
            betId: data.betIds[0],
            newPrice: 1.02
        },
        {
            betId: data.betIds[1],
            newPrice: 990
        }
    ];
    var ref = (new Date()).toISOString();
    session.replaceOrders({marketId:market.marketId, instructions:bets, customerRef:ref}, function(err,res) {
        console.log("replaceOrders err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        data.betIds = result.instructionReports.map( function(i) { return i.placeInstructionReport.betId; });
        console.log(data.betIds);
        cb(err,data);
    });
}

function updateOrders(data, cb) {
    if(!cb) {
        cb = data;
    }
    
    console.log('===== Invoke updateOrders... =====');
    var market = data.selectedMarket;
    var bets = [
        {
            betId: data.betIds[0],
            newPersistenceType: 'PERSIST'
        },
        {
            betId: data.betIds[1],
            newPersistenceType: 'PERSIST'
        }
    ];
    var ref = (new Date()).toISOString();
    session.updateOrders({marketId:market.marketId, instructions:bets, customerRef:ref}, function(err,res) {
        console.log("updateOrders err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err,data);
    });
}

function cancelOrdersPartial(data, cb) {
    if(!cb) {
        cb = data;
    }
    
    console.log('===== Invoke cancelOrders... (PARTIAL CANCEL) =====');
    var market = data.selectedMarket;
    var bets = [
        {
            betId: data.betIds[0],
            sizeReduction: 4.50
        },
        {
            betId: data.betIds[1],
            sizeReduction: 4.50
        }
    ];
    var ref = (new Date()).toISOString();
    session.cancelOrders({marketId:market.marketId, instructions:bets, customerRef:ref}, function(err,res) {
        console.log("cancelOrders err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err,data);
    });
}

function cancelOrdersFull(data, cb) {
    if(!cb) {
        cb = data;
    }
    
    console.log('===== Invoke cancelOrders... (FULL CANCEL) =====');
    var market = data.selectedMarket;
    var bets = [
        {
            betId: data.betIds[0]
        },
        {
            betId: data.betIds[1]
        }
    ];
    var ref = (new Date()).toISOString();
    session.cancelOrders({marketId:market.marketId, instructions:bets, customerRef:ref}, function(err,res) {
        console.log("cancelOrders err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err,data);
    });
}

var actions = [common.login, common.listMarketCatalogue, common.selectMarket, enableEmulator,
    placeOrders, replaceOrders, updateOrders, cancelOrdersPartial, cancelOrdersFull, common.logout];
    
async.waterfall(actions, function(err,res) {
    console.log("Done, err =",err);
    process.exit(0);
});
