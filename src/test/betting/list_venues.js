var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');
var _ = require('lodash');

// Create session to Betfair and start log
var session = common.initialize();

function listVenues(cb = ()=> {}) {
    console.log('===== Invoke listVenues... =====');
    session.listVenues({filter: {}}, function(err, res) {
        console.log("listVenues err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2));
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err, res);
    });
}

async.series([common.login, listVenues, common.logout], function(err, res) {
    console.log("Done, err =", err);
    common.exit(0);
});