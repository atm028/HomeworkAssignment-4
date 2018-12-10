const http = require('http');
const url = require('url');
const config = require('./config');
const {StringDecoder} = require('string_decoder'); 
const _api_handlers = require('./api_handlers');
const _gui_handlers = require('./gui_handlers');
const helpers = require('./helpers');
const path = require('path');
const debug = require('./debug');

var server = {};

debug.info("Create HTTP Server");
server.httpServer = http.createServer((req, res) => {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var queryStringObject = parsedUrl.query;
    var decoder = new StringDecoder('utf-8');
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var buffer = '';

    req.on('data', (data) => { buffer += decoder.write(data); });
    
    req.on('end', () => {
        buffer += decoder.end();
        debug.info("reg: ", trimmedPath, buffer);

        let handler = typeof(server.router[trimmedPath]) !== 'undefined' 
                        ? server.router[trimmedPath] : _api_handlers.notFound;

        handler = trimmedPath.indexOf('public/') > -1 ? _gui_handlers.public : handler;

        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        debug.info(data);
        handler(data, (code, payload, contentType) => {
            debug.info(code, payload, contentType);
            code = typeof(code) == 'number' ? code : 200;
            let payloadString = '';

            if(contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                //payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            }
             if(contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload : '';
            }
              if(contentType == 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
               if(contentType == 'plain') {
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
                if(contentType == 'css') {
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
               if(contentType == 'png') {
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if(contentType == 'jpg') {
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            res.writeHead(code);
            debug.info(code, payloadString, contentType);
            res.end(payloadString);
        });
    });
});

server.router = {
    // GUI API handlers
    "": _gui_handlers.index,
    "signup": _gui_handlers.createUser,
    "login": _gui_handlers.createSession,
    "logout": _gui_handlers.deleteSession,
    "shoppingCard": _gui_handlers.shoppingCard,
    "placeOrder": _gui_handlers.placeOrder,
    "favicon.ico": _gui_handlers.favicon,
    "public": _gui_handlers.public,
    // Platform API Handlers
    "api/handleCard": _api_handlers.handleCard,
    "api/cards": _api_handlers.cards,
    "api/menus": _api_handlers.menus,
    "api/orders": _api_handlers.orders,
    "api/tokens": _api_handlers.tokens,
    "api/users": _api_handlers.users,
    "api/ping": _api_handlers.ping
};

server.init = () => {
    debug.info("Start listening on port ", config.httpPort);
    server.httpServer.listen(config.httpPort, () => {
        debug.info("Server started listening on port: ", config.httpPort);
        debug.info("Server started listening on port: ", config.httpPort);
    });
};


module.exports = server;