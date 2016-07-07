//(C) 2013 Anton Zemlyanov

//This module describes Betfair price
//see Sports API documentation on http://bdp.betfair.com

const epsilon = 0.001;

class BetfairPrice {
    static price(price) {
        return new BetfairPrice(price);
    }
    static increase(price) {
        let pr = new BetfairPrice(price);
        return pr.increase();
    }
    static decrease(price) {
        let pr = new BetfairPrice(price);
        return pr.decrease();
    }
    static spread(price1, price2) {
        let pr1 = new BetfairPrice(price1);
        return pr1.spreadToPrice(price2);
    }

    constructor(price=1.01) {
        this.setPrice(price);
    }

    setPrice(price=1.01) {
        if (typeof (price) === 'string')
            price = parseFloat(price);

        if (price < 1.01)
            price = 1.01;
        else if (price < 2)
            price = Math.round(price * 100.0) / 100.0;
        else if (price < 3)
            price = Math.round(price * 50.0) / 50.0;
        else if (price < 4)
            price = Math.round(price * 20.0) / 20.0;
        else if (price < 6)
            price = Math.round(price * 10.0) / 10.0;
        else if (price < 10)
            price = Math.round(price * 5.0) / 5.0;
        else if (price < 20)
            price = Math.round(price * 2.0) / 2.0;
        else if (price < 30)
            price = Math.round(price * 1.0) / 1.0;
        else if (price < 50)
            price = Math.round(price * 0.5) / 0.5;
        else if (price < 100)
            price = Math.round(price * 0.2) / 0.2;
        else if (price < 1000)
            price = Math.round(price * 0.1) / 0.1;
        else
            price = 1000.0;

        this.price = price.toFixed(2) * 1;
        return;
    }

    increase() {
        var price = this.price;

        if (price < (2.0 - epsilon))
            price += 0.01;
        else if (price < (3.0 - epsilon))
            price += 0.02;
        else if (price < (4.0 - epsilon))
            price += 0.05;
        else if (price < (6.0 - epsilon))
            price += 0.1;
        else if (price < (10.0 - epsilon))
            price += 0.2;
        else if (price < (20.0 - epsilon))
            price += 0.5;
        else if (price < (30.0 - epsilon))
            price += 1.0;
        else if (price < (50.0 - epsilon))
            price += 2.0;
        else if (price < (100.0 - epsilon))
            price += 5.0;
        else if (price < (1000.0 - epsilon))
            price += 10.0;
        else
            price = 1000.0;

        this.price = price.toFixed(2) * 1;
        return this;
    }

    decrease() {
        var price = this.price;

        if (price > (100.0 + epsilon))
            price -= 10.0;
        else if (price > (50.0 + epsilon))
            price -= 5.0;
        else if (price > (30.0 + epsilon))
            price -= 2.0;
        else if (price > (20.0 + epsilon))
            price -= 1.0;
        else if (price > (10.0 + epsilon))
            price -= 0.5;
        else if (price > (6.0 + epsilon))
            price -= 0.2;
        else if (price > (4.0 + epsilon))
            price -= 0.1;
        else if (price > (3.0 + epsilon))
            price -= 0.05;
        else if (price > (2.0 + epsilon))
            price -= 0.02;
        else if (price > (1.01 + epsilon))
            price -= 0.01;
        else
            price = 1.01;

        this.price = price.toFixed(2) * 1;
        return this;
    }

    toString() {
        var str = this.size.toFixed(2);
        if (str.charAt(str.length - 1) === '0')
            str = str.substr(0, str.length - 1);
        // if( str.charAt(str.length-1)==='0' )
        // str = str.substr(0, str.length-2);
        return str;
    }

    spreadToPrice(otherPrice) {
        var other = new BetfairPrice(otherPrice);
        if (Math.abs(this.price - other.price) < epsilon)
            return 0;
        var spread = 0;
        if (other.price < this.price) {
            // negative spread
            while (other.price < (this.price - epsilon)) {
                other.increase();
                --spread;
            }
        } else {
            // positive spread
            while (other.price > (this.price + epsilon)) {
                other.decrease();
                ++spread;
            }
        }
        return spread;
    }
}

module.exports = BetfairPrice;
