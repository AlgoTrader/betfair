// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./../common.js');

// Create session to Betfair and start log
var session = common.initialize();
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});

async.series([common.login, common.keepAlive, common.logout], function (err, res) {
    console.log("Done");
    process.exit(0);
});

