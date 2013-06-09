// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');
var bunyan = require('bunyan')

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY']|| "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

// log all Betfair invocations to 100 records memory ring buffer
var log = {
    level:'info', 
    type:'raw', 
    stream: new bunyan.RingBuffer({ limit: 100 })
};
session.startInvocationLog(log);

// list
function listVenues(data, cb) {
    if(!cb) 
        cb = data;
    
    session.listVenues({}, function(err,res) {
        console.log("listVenues err=%s duration=%s", err, res.duration/1000);
        console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
        console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
        cb(err,res);
    });
}

async.waterfall([common.login, listVenues, common.logout], function(err,res) {
    console.log("Done, err =",err);
    
    // print data from log ring buffer
    console.log("Log Ring Buffer:");
    console.log("==========================================================");
    log.stream.records.forEach( function(i) {
        console.log('Method:%s duration:%s isSuccess:%s', i.method, i.duration, i.isSuccess);
    });
    console.log("==========================================================");
    process.exit(0);
});
