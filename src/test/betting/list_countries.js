var async = require('async');
var betfair = require("../../index.js");
var common = require('../common.js');

// Create session to Betfair and start log
var session = common.initialize();

// list countries
function listCountries(cb=()=>{}) {
    session.listCountries({filter:{}}, function (err, res) {
        console.log("listCounties err=%s duration=%s", err, res.duration / 1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2));
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err, res);
    });
}

async.series([common.login,  listCountries, common.logout], function (err, res) {
    console.log("Done, err =", err);
    process.exit(0);
});