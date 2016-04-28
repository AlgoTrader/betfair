var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');
var _ = require('lodash');

// Create session to Betfair and start log
var session = common.initialize({emulator: true});
var settings = common.settings;

function listMarketBook(cb) {
    console.log('===== Invoke listMarketBook... =====');
    var req = {
        marketIds: [common.settings.selectedMarket.marketId],
        matchProjection: 'NO_ROLLUP',
        priceProjection: {
            priceData: ['EX_BEST_OFFERS', 'EX_TRADED']
        },
        orderProjection: 'ALL'
    };
    session.listMarketBook(req, function(err, res) {
        console.log("listMarketBook err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err);
    });
}

function placeOrders(cb) {
    console.log('===== Invoke placeOrders... =====');
    var market = settings.selectedMarket;
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
                price: 3.0,
                size: 5.00,
                persistenceType: 'LAPSE'
            }
        }
    ];
    var ref = (new Date()).toISOString();
    session.placeOrders({
        marketId: market.marketId,
        instructions: bets,
        customerRef: ref
    }, function(err, res) {
        console.log("placeOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2));
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        settings.betIds = result.instructionReports.map(function(i) {
            return i.betId;
        });
        cb(err, settings);
    });
}

function replaceOrders(cb) {
    console.log('===== Invoke replaceOrders... =====');
    var market = settings.selectedMarket;
    var bets = [
        {
            betId: settings.betIds[0],
            newPrice: 1.02
        },
        {
            betId: settings.betIds[1],
            newPrice: 990
        }
    ];
    var ref = (new Date()).toISOString();
    session.replaceOrders({
        marketId: market.marketId,
        instructions: bets,
        customerRef: ref
    }, function(err, res) {
        console.log("replaceOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        settings.betIds = result.instructionReports.map(function(i) {
            return i.placeInstructionReport.betId;
        });
        console.log(settings.betIds);
        cb(err);
    });
}

function updateOrders(cb) {
    console.log('===== Invoke updateOrders... =====');
    var market = settings.selectedMarket;
    var bets = [
        {
            betId: settings.betIds[0],
            newPersistenceType: 'PERSIST'
        },
        {
            betId: settings.betIds[1],
            newPersistenceType: 'PERSIST'
        }
    ];
    var ref = (new Date()).toISOString();
    session.updateOrders({
        marketId: market.marketId,
        instructions: bets,
        customerRef: ref
    }, function(err, res) {
        console.log("updateOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err);
    });
}

function cancelOrdersPartial(cb) {
    console.log('===== Invoke cancelOrders... (PARTIAL CANCEL) =====');
    var market = settings.selectedMarket;
    var bets = [
        {
            betId: settings.betIds[0],
            sizeReduction: 4.50
        },
        {
            betId: settings.betIds[1],
            sizeReduction: 4.50
        }
    ];
    var ref = (new Date()).toISOString();
    session.cancelOrders({
        marketId: market.marketId,
        instructions: bets,
        customerRef: ref
    }, function(err, res) {
        console.log("cancelOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err);
    });
}

function cancelOrdersFull(cb) {
    console.log('===== Invoke cancelOrders... (FULL CANCEL) =====');
    var market = settings.selectedMarket;
    var bets = [
        {
            betId: settings.betIds[0]
        },
        {
            betId: settings.betIds[1]
        }
    ];
    var ref = (new Date()).toISOString();
    session.cancelOrders({
        marketId: market.marketId,
        instructions: bets,
        customerRef: ref
    }, function(err, res) {
        console.log("cancelOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        cb(err);
    });
}

var actions = [common.login, common.listMarketCatalogue, common.selectMarket,
    listMarketBook, placeOrders, listMarketBook, replaceOrders, updateOrders, cancelOrdersPartial, cancelOrdersFull, common.logout];

async.series(actions, function(err, res) {
    console.log("Done, err =", err);
    common.exit(0);
});
