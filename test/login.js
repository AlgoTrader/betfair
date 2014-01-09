// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var settings = common.settings;
settings.session = betfair.newSession();
settings.login = process.env['BF_LOGIN'] || "nobody";
settings.password = process.env['BF_PASSWORD'] || "password";

var session = settings.session;
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});

async.series([common.login, common.keepAlive, common.logout], function (err, res) {
    console.log("Done");
    process.exit(0);
});
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});
