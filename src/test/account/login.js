var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');
var _ = require('lodash');

// Create session to Betfair and start log
var session = common.initialize();

async.series([common.login, common.keepAlive, common.logout], function(err, res) {
    console.log("Done");
    process.exit(0);
});

