const util = require('util');
const BetfairSession = require('../lib/session.js');

const appKey = process.env['BF_APP_KEY'] || "nokey";

let session = new BetfairSession(appKey);
console.log(BetfairSession, session, session.__proto__);
session.getAccountFunds({}, (...args)=>{console.log(util.inspect(args,{depth:10}))});