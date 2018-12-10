const _data = require('../lib/data');
const helpers = require('../lib/helpers');
const debug = require('./debug');

var method_handler = {};
method_handler._tokens = {};

/**
 * verify if token is valid
 * @return: true if token is valid and false in other case
 * @required_params: 
 *  - email
 *  - token
 * @optional_params: None
 */
method_handler._tokens.verifyToken = async (token, email) => {
    try {
        const data = await _data.read('tokens', token);
        if(data.email == email && data.id == token) return true;
        else return false;
    } catch(e) {
        debug.error(e);
        return false;
    }
};

/**
 * GET method for token handler
 * @return: token object
 * @required_params: 
 *  - id - token id
 * @optional_params: None
 */
method_handler.get = async (data) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? 
            data.queryStringObject.id.trim() :  false;
    if(id) {
        try {
            const data = await _data.read('tokens', id);
            return helpers.formResponce(200, data, 'json');
        } catch(err) {
            return helpers.formResponce(404, undefined, 'html');
        }
    } else {
        return helpers.formResponce(400, {"error": 'Missing required fields'});
    }
};

/**
 * POST method for token handler
 * @return: none
 * @required_params: 
 *  - email
 *  - password
 * @optional_params: None
 */
method_handler.post = async (data) => {
    debug.info(data);
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? 
        data.payload.email.trim() :  false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(email && password) {
        try {
            const data = await _data.read('users', email);
            debug.info(data);
            if(data) {
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == data.hashedPassword) {
                    var tokenID = helpers.createRandomString(20);
                    var tokenObj = {
                        "email": email,
                        "id": tokenID
                    };
                    debug.info(tokenObj);
                    await _data.create('tokens', tokenID, tokenObj);
                    return helpers.formResponce(200, tokenObj, 'json');
                } else {
                    debbug.error("Password does not match");
                    helpers.formResponce(400, {"error": 'Password does not match'}, "json");
                }
            } else helpers.formResponce(404, {"body": "The specified user cannot be found"}, 'json');
        } catch(err) {
            debug.error(err);
            return helpers.formResponce(500,{'error': 'could not create token, maybe it already exist'}, 'json');
        }
    } else {
        helpers.formResponce(400, {"error": "Missing required fields"}, 'json');
    }
    return helpers.formResponce(500, undefined, 'html');
};

/**
 * PuT method for token handler
 * @return: updated token object
 * @required_params: 
 *  - id - token id
 *  - extend - true if the token should be extended, false otherwise
 * @optional_params: None
 */
method_handler.put = async (data) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? 
            data.queryStringObject.id.trim() :  false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ?  true : false;

    if(id && extend) {
        try {
            const data = await _data.read('tokens', id);
            if(data) {
                if(data.expires > Date.now()) {
                    data.expires = Date.now() + 1000 * 60 * 60;
                    await _data.update('tokens', id, data);
                    return helpers.formResponce(200, data, 'json');
                } else {
                    return helpers.formResponce(400, {'error': 'Token is expired and could not be extended'}, 'json');
                }
            } else return helpers.formResponce(400, {'error': 'Specified token does not exist'}, 'json');
        } catch(e) {
            return helpers.formResponce(500, e);
        }
    } else {
        return helpers.formResponce(400, {"error": "Missing required fields or one of them is incorrect"}, 'json');
    }

};

/**
 * DELETE method for token handler
 * @return: none
 * @required_params: 
 *  - id - token id
 * @optional_params: None
 */
method_handler.delete = async (data) => {
    debug.info(data);
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? 
            data.queryStringObject.id.trim() :  false;
    debug.info(id);
    if(id) {
        try {
            await _data.delete('tokens', id);
            return helpers.formResponce(200, undefined, 'html');
        } catch(e) {
            return helpers.formResponce(404, {'error': 'cannot find specified token'}, 'json');
        }
    } else return helpers.formResponce(400, {"error": 'Missing required fields'}, 'json');
};

module.exports = method_handler;