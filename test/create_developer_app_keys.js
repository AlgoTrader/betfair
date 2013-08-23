// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY'] || "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

// log all Betfair invocations
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});

// list countries
function createDeveloperAppKeys(data, cb) {
    if (!cb)
        cb = data;

    session.createDeveloperAppKeys({appName: "ApiNgTestApplication2"}, function (err, res) {
        console.log("createDeveloperAppKeys err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err, res);
    });
}

async.waterfall([common.login, createDeveloperAppKeys, common.logout], function (err, res) {
    console.log("Done, err =", err);
    process.exit(0);
});
