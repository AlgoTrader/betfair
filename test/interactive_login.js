// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var appKey = process.env['BF_APPLICATION_KEY']|| "invalid";
var session = common.session = betfair.newSession(appKey);
common.loginName = process.env['BF_LOGIN'] || "nobody";
common.password = process.env['BF_PASSWORD'] || "password";

// login to Betfair
var login = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par;
                    
    console.log('===== Logging in to Betfair =====');
    //var session = exports.session;
    session.interactiveLogin(common.loginName, common.password, function(err, res) {
        if (err) {
            console.log('Login error', err);
        } else {
            console.log('Login OK, %s secs', res.duration/1000);
        }
        exports.loginCookie = res.responseCookie;
        cb(err, {});
    });
}

async.waterfall([login], function(err,res) {
    console.log("Done");
    process.exit(0);
});