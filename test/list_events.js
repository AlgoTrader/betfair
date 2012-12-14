// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var session = betfair.newSession();
common.session = session;
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";
common.applicationKey = process.env['BF_APPLICATION_KEY'] || "invalid";

// list countries
function listEvents(data, cb) {
    if(!cb) 
        cb = data;
    
    session.listEvents({}, function(err,res) {
        console.log("listEvents err=%s duration=%s", err, res.duration()/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err,res);
    });
}

async.waterfall([common.login, listEvents, common.logout], function(err,res) {
    console.log("Done, err =",err);
    process.exit(0);
});
