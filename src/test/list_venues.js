// Betfair account data
var betfair = require("../index.js");
var async = require('async');
var common = require('./common.js');

// Create session to Betfair
var settings = common.settings;
settings.session = betfair.newSession();
settings.login = process.env['BF_LOGIN'] || "nobody";
settings.password = process.env['BF_PASSWORD'] || "password";

// log all Betfair invocations
var session = settings.session;
session.startInvocationLog({level: 'info', path: 'log_invocations.txt'});

// list
function listVenues(cb) {
	session.listVenues({filter: {}}, function (err, res) {
		console.log("listVenues err=%s duration=%s", err, res.duration / 1000);
		console.log("Request:%s\n", JSON.stringify(res.request, null, 2))
		console.log("Response:%s\n", JSON.stringify(res.response, null, 2));
		cb(err, res);
	});
}

async.series([common.login, common.getDeveloperAppKeys, listVenues, common.logout], function (err, res) {
	console.log("Done, err =", err);
	process.exit(0);
});
