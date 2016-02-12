const BetfairSession = require('../lib/session.js');

let session = new BetfairSession('1234567890');
console.log(BetfairSession, session, session.__proto__);
