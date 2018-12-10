const _data = require('./data');
const helpers = require('./helpers');
const _token_handlers = require('./tokens_handlers');
const debug = require('./debug');

var method_handler = {};

/**
 * GET method for user handler
 * @return: user object
 * @required_params: 
 *  - email
 *  - token
 *  - callback
 * @optional_params: None
 */
method_handler.get = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
            data.queryStringObject.email.trim() :  false;
    if(email) {
        debug.info("Verifying token");
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            debug.info(isValid);
            if(isValid) {
                try {
                    var data = await _data.read('users', email);
                    debug.info(data);
                    if(data) {
                        debug.info("Deleting password");
                        delete data.hashedPassword;
                        debug.info(data);
                        return helpers.formResponce(200, data, 'json');
                    } else {
                        return helpers.formResponce(404);
                    }
                } catch(e) {
                    return helpers.formResponce(500, e);
                }
            } else {
                return helpers.formResponce(403, {'error': 'Incorrect token'}, 'json');
            }
        }
    } else {
        return helpers.formResponce(400, {"error": 'Missing required fields'}, 'json');
    }
};

/**
 * POST method for user handler
 * @return: none
 * @required_params: 
 *  - firstName
 *  - lastName
 *  - email
 *  - password
 *  - callback
 * @optional_params: None
 */
method_handler.post = async (data) => {
    debug.info(data);
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(firstName && lastName && email && password) {
        try {
            const readData = await _data.read('users', email);
            if(readData) return helpers.formResponce(405, {"msg": 'user already exists'}, 'json');
        } catch(err) {
            var hashedPassword = helpers.hash(password);
            var userObject = {
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'hashedPassword': hashedPassword,
                'date': Date.now()
            };
            debug.info(userObject);
            try {
                await _data.create('users', email, userObject);
                return helpers.formResponce(200, undefined, 'html');
            } catch(err) { 
                return helpers.formResponce(500, {"msg": err}, 'json'); 
            }
        }
    } else return helpers.formResponce(400, {"error": "Missing required fields"}, 'json');
    return helpers.formResponce(500, undefined, 'html');
};

/**
 * PUT method for token handler
 * @return: updated user object
 * @required_params: 
 *  - email
 *  - firstName
 *  - lastName
 *  - password
 *  - token
 * @optional_params: None
 */
method_handler.put = async (data) => {
    debug.info(data);
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
        data.queryStringObject.email.trim() :  false;
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(email) {
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            if(isValid) {
                if(firstName || lastName || password) {
                    try {
                        const data = await _data.read('users', email);
                        if(!err && data) {
                            if(firstName) data.firstName = firstName;
                            if(lastName) data.lastName = lastName;
                            if(password) data.hashedPassword = helpers.hash(password);
                            await _data.update('users', email, data);
                            return helpers.formResponce(200, data, 'json');
                        } else {
                            return helpers.formResponce(400, {"error": "The specified user does not exist"}, 'json');
                        }
                    } catch(e) {
                        return helpers.formResponce(500, e);
                    }
                } else {
                    return helpers.formResponce(400, {"error": "Missing fields to update"}, 'json');
                }
            } else {
                return helpers.formResponce(403, {'error': 'Incorrect token'}, 'json');
            }
        }
    } else {
        return helpers.formResponce(400, {"error": "Missing required fields"}, 'json');
    }

};

/**
 * DELETE method for user handler
 * @return: 200OK or error
 * @required_params: 
 *  - email
 *  - token
 * @optional_params: None
 */
method_handler.delete = async (data) => {
     var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? 
            data.queryStringObject.email.trim() :  false;
    if(email) {
        var token = typeof(data.queryStringObject.token) == 'string' ? data.queryStringObject.token : false;
        if(!token) return helpers.formResponce(403, {'error': 'token is not specified'}, 'json');
        else {
            const isValid = await _token_handlers._tokens.verifyToken(token, email);
            if(isValid) {
                const userData = await _data.read('users', email);
                if(userData) {
                    await _data.delete('users', email);
                    return helpers.formResponce(200);
                } else {
                    callback(404);
                }
            } else {
                callback(403, {'error': 'Incorrect token'});
            }
        }
    } else {
        callback(400, {"error": 'Missing required fields'});
    }
};

//GUI handlers
//method_handler.gui = {};
//method_handler.gui.get = (data, callback) => {};

module.exports = method_handler;