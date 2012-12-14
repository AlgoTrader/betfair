// This module contains functions shared by multiple tests
var util = require('util');

// session to use for all the invocations, should be set by test
exports.session = null;
exports.loginName = null;
exports.password = null;
exports.applicationKey = null;

// login to Betfair
exports.login = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 

    console.log('===== Logging in to Betfair =====');
    var session = exports.session;
    session.open(exports.loginName, exports.password, exports.applicationKey, function(err, res) {
        if (err) {
            console.log('Login error', err);
        } else {
            console.log('Login OK, %s secs', res.duration()/1000);
        }
        exports.loginCookie = res.responseCookie;
        cb(err, {});
    });
}

// logout from Betfair
exports.logout = function(par, cb) {
    if(!cb)
        // cb is first parameter
        cb = par; 
    
    console.log('===== Logging out... =====');
    var session = exports.session;
    session.close(function(err, res) {
        if (err) {
            console.log('Logout error', err);
        } else {
            console.log('Logout OK, %s secs', res.duration()/1000);
        }
        cb(err, {});
    });
}

