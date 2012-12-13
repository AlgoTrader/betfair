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
function listCountries(data, cb) {
    if(!cb) 
        cb = data;
    
    session.listCountries({}, function(err,res) {
        cb(err,res);
    });
}

async.waterfall([common.login, listCountries, common.logout], function(err,res) {
    console.log("Done",err,res);
    process.exit(0);
});