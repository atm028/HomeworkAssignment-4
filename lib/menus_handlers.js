const _data = require('./data');
const _token_handlers = require('./tokens_handlers');
const debug = require('./debug');
const helpers = require('../lib/helpers');

var method_handler = {};

/**
 * GET method for menu handler
 * @return: menu object
 * @required_params: 
 *  - email
 *  - menuName
 *  - token
 * @optional_params: None
 */
method_handler.get = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var menuName = typeof(data.queryStringObject.menuName) == 'string' && data.queryStringObject.menuName.trim().length > 0 ? data.queryStringObject.menuName.trim() : false;
    if(menuName) {
        var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
        if(!token) helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            try {
                debug.info("Verify token");
                const isValid = await _token_handlers._tokens.verifyToken(token, email);
                debug.info(isValid);
                if(isValid) {
                    const readData = await _data.read('menus', menuName);
                    if(readData) {
                        return helpers.formResponce(200, readData, 'json');
                    } else return helpers.formResponce(404, {'error': 'Cannot find menu with file '+menuName}, 'json');
                } else return helpers.formResponce(404, {'error': 'Cannot find specified user'}, 'json');
            } catch(e) {
                return helpers.formResponce(500, e, 'json');
            }
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

/**
 * POST method for menu handler
 * @return: 200OK in case of success or error
 * @required_params: 
 *  - email
 *  - menuName
 *  - menuDescription
 *  - menuItems
 *  - token
 * @optional_params: None
 */
method_handler.post = async (data) => {
    debug.info(data);
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? 
           data.payload.email.trim() :  false;
    var menuName = typeof(data.payload.menuName) == 'string' && data.payload.menuName.trim().length > 0 ? data.payload.menuName.trim() : false;
    var menuDescription = typeof(data.payload.menuDescription) == 'string' ? data.payload.menuDescription : '';
    var menuItems = typeof(data.payload.menuItems) == 'object' && data.payload.menuItems instanceof Object ? data.payload.menuItems : {};

    if(email && menuName && menuDescription && menuItems) {
        var token = typeof(data.payload.token) == 'string' && data.payload.token.trim().length > 0 ? data.payload.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            debug.info("Verify token");
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                debug.info(menuName);
                try {
                    const menuData = await _data.read('menus', menuName);
                    if(menuData) {
                        var menuObject = {
                            name: menuName,
                            description: menuDescription,
                            items: menuItems,
                            by: email,
                            data: Date.now()
                        };
                        debug.info(menuObject);
                        await _data.create('menus', menuName, menuObject);
                        return helpers.formResponce(200);
                    } else return helpers.formResponce(400, {'error': 'The menu already exist'}, 'json');
                } catch(e) {
                    return helpers.formResponce(500, e, 'json');
                }
            } else return helpers.formResponce(404, {'error': 'Cannot find specified user'}, 'json');
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

/**
 * DELETE method for menu handler
 * @return: 200OK or error
 * @required_params: 
 *  - email
 *  - menuName
 *  - menuItems
 *  - token
 * @optional_params: None
 */
method_handler.delete = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var menuName = typeof(data.payload.menuName) == 'string' && data.payload.menuName.trim().length > 0 ? data.payload.menuName.trim() : false;
    var menuItems = typeof(data.payload.menuItems) == 'object' && data.payload.menuItems instanceof Array ? data.payload.menuItems : [];
    
    if(email && menuName) {
        var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            debug.info("Verify token");
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                try {
                    if(menuItems.length > 0) {
                        const readData = await _data.read('menus', menuName);
                        if(readData) {
                            menuItems.forEach(item => {
                                readData.items.splice(
                                    readData.items.indexOf(
                                        readData.items.filter(el => el.itemName == item)[0]
                                    ), 
                                    1
                                );
                            });
                            debug.info("Update with object", readData);
                            await _data.update('menus', menuName, readData);
                            return helpers.formResponce(200, readData, 'json');
                        } else return helpers.formResponce(500, readErr);
                    } else {
                        await _data.delete('menus', menuName);
                        return helpers.formResponce(200);
                    }
                } catch(e) {
                    return helpers.formResponce(500, e, 'json');
                }
            }
        }
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

/**
 * PUT method for menu handler for delete either whole menu or several items from the one
 * @return: updated menu object or error
 * @required_params: 
 *  - email
 *  - menuName
 *  - token
 * @optional_params: 
 *  - menuDescription
 *  - menuItems
 */
method_handler.put = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
           data.queryStringObject.email.trim() :  false;
    var menuName = typeof(data.payload.menuName) == 'string' && data.payload.menuName.trim().length > 0 ? data.payload.menuName.trim() : false;

    if(typeof(data.payload.update) == 'object') {
        var menuDescription = typeof(data.payload.update.menuDescription) == 'string' ? data.payload.update.menuDescription : '';
        var menuItems = typeof(data.payload.update.menuItems) == 'object' && data.payload.update.menuItems instanceof Array ? data.payload.update.menuItems : [];

        if(email && menuName) {
            debug.info("Verify token");
            var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.trim().length > 0 ? data.queryStringObject.token : false;
            if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
            else {
                const isValid = await _token_handlers._tokens.verifyToken(token, email);
                debug.info(isValid);
                if(isValid) {
                    try {
                        const readData = await _data.read('menus', menuName);
                        if(readData) {
                            menuItems.forEach(item => readData.items.push(item));
                            if(menuDescription) readData.description = menuDescription;
                            readData.data = Date.now();
                            debug.info("Update with object: ", readData);
                            await _data.update('menus', menuName, readData);
                            return helpers.formResponce(200, readData, 'json');
                        } else return helpers.formResponce(500, readErr);
                    } catch(e) {
                        return helpers.formResponce(500, e);
                    }
                }
            }
        } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
    } else return helpers.formResponce(400, {'error': 'Missing required fields'}, 'json');
};

////GUI handlers
//method_handler.gui = {};
//method_handler.gui.get = (data, callback) => {};

module.exports = method_handler;