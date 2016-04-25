let BetfairPrice = require('../../index.js').BetfairPrice;

console.log("Betfair price extreme values:");
console.log('Price below 1.01 test: %s', new BetfairPrice(1.0).toString());
console.log('Price below above 1000 test: %s', new BetfairPrice(1001.0).toString());

console.log("Test rounding of betfair prices:");
console.log('Price 1.01-2.00 rounded to 0.01    %s', new BetfairPrice(1.1134567).toString());
console.log('Price 2.00-3.00 rounded to 0.02    %s', new BetfairPrice(2.2345678).toString());
console.log('Price 3.00-4.00 rounded to 0.05    %s', new BetfairPrice(3.2345678).toString());
console.log('Price 4.00-6.00 rounded to 0.1     %s', new BetfairPrice(4.1345678).toString());
console.log('Price 6.00-10.00 rounded to 0.2    %s', new BetfairPrice(7.2345678).toString());
console.log('Price 10.00-20.00 rounded to 0.5   %s', new BetfairPrice(11.678901).toString());
console.log('Price 20.00-30.00 rounded to 1     %s', new BetfairPrice(21.2345678).toString());
console.log('Price 30.00-50.00 rounded to 2     %s', new BetfairPrice(31.2345678).toString());
console.log('Price 50.00-100.00 rounded to 5    %s', new BetfairPrice(66.2345678).toString());
console.log('Price 100.00-1000.00 rounded to 10 %s', new BetfairPrice(123.2345678).toString());

console.log("Test spread:");
var price = new BetfairPrice(1.01);
console.log('Spread 1.01 to 1.01 is %s', price.spreadToPrice(1.01));
console.log('Spread 1.01 to 1.02 is %s', price.spreadToPrice(1.02));
console.log('Spread 1.01 to 1.10 is %s', price.spreadToPrice(1.10));
console.log('Spread 1.01 to 2.0 is %s', price.spreadToPrice(2.0));
console.log('Spread 1.01 to 1000 is %s', price.spreadToPrice(1000));
var price = new BetfairPrice(1000);
console.log('Spread 1000 to 1000 is %s', price.spreadToPrice(1000));
console.log('Spread 1000 to 990 is %s', price.spreadToPrice(990));
console.log('Spread 1000 to 500 is %s', price.spreadToPrice(500));
console.log('Spread 1000 to 1.02 is %s', price.spreadToPrice(1.02));
console.log('Spread 1000 to 1.01 is %s', price.spreadToPrice(1.01));
var price = new BetfairPrice(2.0);
console.log('Spread 2.0 to 2.0 is %s', price.spreadToPrice(2.0));
console.log('Spread 2.0 to 2.02 is %s', price.spreadToPrice(2.02));
console.log('Spread 2.0 to 1.99 is %s', price.spreadToPrice(1.99));
console.log('Spread 2.0 to 1.01 is %s', price.spreadToPrice(1.01));
console.log('Spread 2.0 to 1000 is %s', price.spreadToPrice(1000));


console.log("Test accending prices:");
var cnt = 0;
var price = new BetfairPrice(1.01);
while (true) {
    console.log('index:%s price:%s', cnt, price.toString());
    if (price.toString() === '1000.0')
        break;
    price.increasePrice();
    ++cnt;
}

console.log("Test decending prices:");
var cnt = 0;
var price = new BetfairPrice(1000.0);
while (true) {
    console.log('index:%s price:%s', cnt, price.toString());
    if (price.toString() === '1.01')
        break;
    price.decreasePrice();
    ++cnt;
}
