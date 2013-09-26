// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var settings = common.settings;
settings.session = betfair.newSession();
settings.login = process.env['BF_LOGIN'] || "nobody";
settings.password = process.env['BF_PASSWORD'] || "password";

// log all Betfair invocations
var session = settings.session;
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});

// Emulator log
session.startEmulatorLog({level: 'info', path: 'log_emulator.txt'});

// Optional step to test emulator
function enableEmulator(data, cb) {
    if (!cb) {
        cb = data;
    }

    var mId = data.selectedMarket.marketId;
    console.log('===== Enable emulator for marketId=%s... =====', mId);
    session.enableBetEmulatorForMarket(mId);
    cb(null, data);
}


function listMarketBook(data, cb) {
    if (!cb)
        cb = data;

    //var price = ['EX_ALL_OFFERS'];
    var req = {
        marketIds: [data.selectedMarket.marketId],
        matchProjection: 'NO_ROLLUP',
        priceProjection: {priceData: ['EX_ALL_OFFERS', 'EX_TRADED']}
    };
    session.listMarketBook(req, function (err, res) {
        console.log("listMarketBook err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err, data);
    });
}

function placeOrders(data, cb) {
    if (!cb) {
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
    session.placeOrders({marketId: market.marketId, instructions: bets, customerRef: ref}, function (err, res) {
        console.log("placeOrders err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        var result = res.response.result;
        data.betIds = result.instructionReports.map(function (i) {
            return i.betId;
        });
        cb(err, data);
    });
}

async.series([common.login, common.listMarketCatalogue, common.selectMarket, enableEmulator,
    listMarketBook, placeOrders, common.logout], function (err, res) {
    console.log("Done, err =", err);
    process.exit(0);
});
