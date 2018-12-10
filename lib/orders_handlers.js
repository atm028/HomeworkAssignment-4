const debug = require('../lib/debug');
const _token_handlers = require('./tokens_handlers');
const _card_handler = require('./cards_handlers');
const _helpers = require('./helpers');
const _data = require('./data');
const queryString = require('querystring');
const https = require('https');
const config = require('./config');

var methods = {};

/**
 * placing the order by sending the request to stripe
 * @return: menu object
 * @required_params: 
 *  - list of items in order
 *  - final - amount price of the order
 * @optional_params: None
 */
methods.placeOrder = async (orderId, obj) => {
    const orderData = {
        id: orderId,
        items: obj.items,
        price: obj.final,
        iat: Date.now()
    };
    debug.info(orderData);
    const strOrderData = queryString.stringify({
        currency: 'usd',
        amount: orderData.price*100,
        description: 'charges for orderId '+orderId,
        source: 'tok_visa'
    });
    debug.info(strOrderData);
    const reqOptions = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        port: 443,
        path: '/v1/charges',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(strOrderData),
            'Authorization': 'Bearer '+config.stripe.secret_key
        }
    };
    debug.info(reqOptions);
    const req = https.request(reqOptions, (res) => {
        res.setEncoding('utf8');
        var rcvData = '';
        res.on('data', (chunk) => rcvData += chunk);
        res.on('end', () => {
            debug.error(rcvData);
            var msg = 'Hello, \n Your order: \n ';
            for(const k of Object.keys(obj.items)) msg += k+" : "+obj.items[k]+'\n';
            msg+= 'Amount: $'+obj.final;
            _helpers.sendEmail(obj.by, 'Order ID: '+orderData.id, msg, (emailErr, emailRes) => {
                if(emailErr) debug.error(emailErr, emailRes);
            });
        });
    });

    req.on('error', (e) => debug.error(e));
    req.on('timeout', (e) => debug.error(e));
    req.write(strOrderData);
    req.end();
};

var orderObject = {
    items: {},
    final: 0
};

/**
 * build order object
 * @return: order object
 * @required_params: 
 *  - cardNames
 * @optional_params: None
 */
const makeOrderObject = async (cardNames) => {
    for(const cardName of cardNames) {
        const cardData = await _data.read('cards', cardName);
        for(const cardItem of cardData.items) {
            const menuData = await _data.read('menus', cardItem.menuName);
            debug.info(menuData.items[cardItem.itemName]);
            var cost = menuData.items[cardItem.itemName].itemPrice * cardItem.volume;
            if(cardItem.itemName in orderObject.items) {
                orderObject.items[cardItem.itemName] += cost;
            } else {
                orderObject.items[cardItem.itemName] = cost;
            }
            debug.info(cardItem.itemName, orderObject.items[cardItem.itemName]);
            orderObject.final += cost;
        }
    }
};

/**
 * POST method for order handler
 * @return: menu object
 * @required_params: 
 *  - email
 *  - orderName
 *  = cardOItems
 *  - token
 *  - callback
 * @optional_params: None
 */
methods.post = async (data) => {
    debug.info(data);
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? 
           data.payload.email.trim() :  false;
    var orderName = typeof(data.payload.orderName) == 'string' && data.payload.orderName.trim().length > 0 ? data.payload.orderName.trim() : false;
    var cardItems = typeof(data.payload.cardItems) == 'object' && data.payload.cardItems instanceof Array ? data.payload.cardItems : [];

    if(email && orderName && cardItems) {
        debug.info("<<<");
        var token = typeof(data.payload.token) == 'string' && data.payload.token.trim().length > 0 ? data.payload.token : false;
        if(!token) return _helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            debug.info("Verify token");
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                debug.info("Prepare order object");
                var orderId = _helpers.createRandomString(16);
                await makeOrderObject(cardItems);
                var tmpCardData = await _data.read('cards', email);
                tmpCardData.date = Date.now();
                tmpCardData.orderId = orderId;
                await _data.delete('cards', email);
                await _data.create('orders', orderId+"_"+tmpCardData.data, tmpCardData);
                orderObject.name = orderName;
                orderObject.by = email;
                orderObject.data = Date.now();
                orderObject.placed = false;
                debug.info(orderObject);
                await methods.placeOrder(orderId, orderObject);
                return _helpers.formResponce(200);
            } else return _helpers.formResponce(404, {'error': 'Cannot find specified user'}, 'json');
        }
    } else return _helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

//GUI handlers
methods.gui = {};
methods.gui.get = (data, callback) => {};

module.exports = methods;