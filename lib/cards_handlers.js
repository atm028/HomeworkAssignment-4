const debug = require('../lib/debug');
const _token_handlers = require('./tokens_handlers');
const helpers = require('./helpers');
const _data = require('./data');

var method_handler = {};

/**
 * Handle GET request to get existing Shopping cards
 * @return: shopping card object
 * @required_params: email, card name, token
 * @optional_params: None
 */
method_handler.get = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var cardName = typeof(data.queryStringObject.cardName) == 'string' && data.queryStringObject.cardName.trim().length > 0 ? data.queryStringObject.cardName.trim() : false;
    if(cardName) {
        var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            if(isValid) {
                const data = await _data.read('cards', cardName);
                return helpers.formResponce(200, data, 'json');
            } else return helpers.formResponce(404, {'error': 'Cannot find specified user'}, 'json');
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

/**
 * Handle POST request create new Shopping cards
 * @return: None
 * @required_params: email, card name, card items, token
 * @optional_params: None
 */
method_handler.post = async (data) => {
    debug.info(data);
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? 
           data.payload.email.trim() :  false;
    var cardName = typeof(data.payload.cardName) == 'string' && data.payload.cardName.trim().length > 0 ? data.payload.cardName.trim() : false;
    var cardItems = typeof(data.payload.cardItems) == 'object' && data.payload.cardItems instanceof Array ? data.payload.cardItems : [];

    if(email && cardName && cardItems) {
        debug.info("<<<");
        var token = typeof(data.payload.token) == 'string' && data.payload.token.trim().length > 0 ? data.payload.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            debug.info("Verify token");
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                debug.info(cardName);
                try {
                    var cardData = await _data.read('cards', cardName);
                    debug.info(cardData);
                    for(const k in cardItems) {
                        const item = cardItems[k];
                        var index = cardData.items.indexOf(cardData.items.filter(el => el.menuName == item.menuName && el.itemName == item.itemName)[0]);
                        debug.info(k, item, index);
                        if(index > -1) cardData.items[index].volume += item.volume;
                        else cardData.items.push(item);
                        await _data.update('cards', cardName, cardData);
                        return helpers.formResponce(200);
                    }
                } catch(e) {
                    debug.info("Prepare object");
                    var cardObject = {
                        name: cardName,
                        items: cardItems,
                        by: email,
                        data: Date.now()
                    };
                    debug.info(cardObject);
                    await _data.create('cards', cardName, cardObject);
                    return helpers.formResponce(200);
                }
            } else return helpers.formResponce(404, {'error': 'Cannot find specified user'}, 'json');
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

/**
 * Handle PUT request to update an existing Shopping cards
 * @return: None
 * @required_params: email, card name, token
 * @optional_params: None
 */
method_handler.put = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var cardName = typeof(data.payload.cardName) == 'string' && data.payload.cardName.trim().length > 0 ? data.payload.cardName.trim() : false;

    if(typeof(data.payload.update) == 'object') {
        var cardItems = typeof(data.payload.update.cardItems) == 'object' && data.payload.update.cardItems instanceof Array ? data.payload.update.cardItems : [];
        debug.info(email, cardName);
        if(email && cardName) {
            debug.info("Verify token");
            var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
            if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
            else {
                const isValid = await _token_handlers._tokens.verifyToken(token, email);
                debug.info(isValid);
                if(isValid) {
                    try {
                        const readData = await _data.read('cards', cardName);
                        if(readData) {
                            cardItems.forEach(item => {
                                var index = readData.items.indexOf(readData.items.filter(el => el.menuName == item.menuName && el.itemName == item.itemName)[0]);
                                debug.info(index, item);
                                if(index > -1) readData.items[index].volume = item.volume;
                                else readData.items.push(item)
                            });
                            readData.data = Date.now();
                            debug.info("Update with object: ", readData);
                            await _data.update('cards', cardName, readData);
                            return helpers.formResponce(200, readData, 'json');
                        } else return helpers.formResponce(500, readErr);
                    } catch(e) {
                        return helpers.formResponce(500, e);
                    }
                }
            }
        } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
    } else return helpers.formResponce(400, {'error': 'Missing required update fields'}, 'json');
};

/**
 * Handle DELETE request to delete an existing Shopping cards or one/several items from an existing shopping card
 * @return: None
 * @required_params: email, card name, card items, token
 * @optional_params: None
 */
method_handler.delete = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var cardName = typeof(data.payload.cardName) == 'string' && data.payload.cardName.trim().length > 0 ? data.payload.cardName.trim() : false;
    var cardItems = typeof(data.payload.cardItems) == 'object' && data.payload.cardItems instanceof Array ? data.payload.cardItems : [];
    
    if(email && cardName) {
        var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            debug.info("Verify token");
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                if(cardItems.length > 0) {
                    try {
                        const readData = await _data.read('cards', cardName);
                        if(!readData) {
                            cardItems.forEach(item => {
                                readData.items.splice(
                                    readData.items.indexOf(
                                        readData.items.filter(el => el.itemName == item)[0]
                                    ), 
                                    1
                                );
                            });
                            debug.info("Update with object", readData);
                            await _data.update('cards', cardName, readData);
                            return helpers.formResponce(200, readData, 'json');
                        } else return helpers.formResponce(500, readErr);
                    } catch (e) {
                        return helpers.formResponce(500, e);
                    }
                } else {
                    _data.delete('cards', cardName, (err) => {
                        if(!err) return helpers.formResponce(200);
                        else return helpers.formResponce(404, {'error': 'Cannot find specified menu'}, 'json');
                    });
                }
            }
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

////GUI handlers
//method_handler.gui = {};
//method_handler.gui.get = (data, callback) => {};

module.exports = method_handler;