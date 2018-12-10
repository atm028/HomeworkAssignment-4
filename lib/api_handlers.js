/*
 * Main API Request Handlers
 */

const _cards_handlers = require('./cards_handlers');
const _menu_handlers = require('./menus_handlers');
const _orders_handlers = require('./orders_handlers');
const _tokens_handlers = require('./tokens_handlers');
const _users_handlers = require('./users_handlers');

const debug = require('./debug');


var handlers = {};

handlers.notFound = (data, callback) => {
    callback(404, {"msg": "Something goes wrong"}, 'json');
};

// User handlers
handlers.cards = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        _cards_handlers[data.method](data, callback);
    } else handlers.notFound(data, callback);
};

handlers.handleCard = (data, callback) => {
    debug.info(JSON.parse(data.payload.redirect));
    callback(200);
};

// Menu handlers
handlers.menus = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        _menu_handlers[data.method](data, callback);
    } else handlers.notFound(data, callback);
};

// Orders handlers
handlers.orders = (data, callback) => {
    const acceptableMethods = ['post'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        _orders_handlers[data.method](data, callback);
    } else handlers.notFound(data, callback);
};

// Tokens handlers
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        _tokens_handlers[data.method](data).then(v => {
            debug.info(v);
            callback(v.code, v.body, v.type);
        });
    } else handlers.notFound(data, callback);
};

// Users handlers
handlers.users = (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        _users_handlers[data.method](data).then(v => {
            callback(v.code, v.body, v.type);
        });
    } else handlers.notFound(data, callback);
};

handlers.ping = (data, callback) => {
    console.log("PING");
    if('get' == data.method) {
        callback(200, {"msg": "PONG"}, 'json');
    } else handlers.notFound(data, callback);
};


module.exports = handlers;