/*
 * Main GUI Request Handlers
 */

const _cards_handlers = require('./cards_handlers');
const _menu_handlers = require('./menus_handlers');
const _orders_handlers = require('./orders_handlers');
const _tokens_handlers = require('./tokens_handlers');
const _users_handlers = require('./users_handlers');

const helpers = require('../lib/helpers');
const _data = require('../lib/data');

var handlers = {};

// handler for index and default gui path
handlers.index = (data, callback) => {
    debug.info(data);
    if('get'.indexOf(data.method) > -1) {
        var templateData = {
            'head.title': 'Panucci\'s Pizza',
            'body.class': 'index'
        };

        var menuData = {};
        try {
            _data.read('menus', 'test_menu').then(menuData => {
                debug.info(menuData);
                templateData['menu.name'] = menuData.name;
                templateData['menu.description'] = menuData.description;
                var menuItemsStr = '';
                for(const k in menuData.items) {
                    //TODO: add the adding to the shopping card
                    menuItemsStr += "<tr><td>"+k+"</td><td>"+menuData.items[k].itemPrice+"</td>";
                    menuItemsStr += "<td><input type='button' \
                                        id='addToCard' \
                                        onClick=\"addToCardButtonHandler('"+k+"','"+menuData.items[k].itemPrice+"')\" \
                                        class='cta blue loggedIn' \
                                        value='Add to card'> \
                                    </td></tr>";
                }
                templateData['menu.items'] = menuItemsStr;
                debug.info(templateData);
                helpers.getTemplate('index', templateData, (err, str) => {
                    debug.info(err);
                    if(!err && str) {
                        debug.info(err);
                        helpers.addUniversalTemplates(str, templateData, (err, str) => {
                            debug.info(err, str);
                            if(!err && str) callback(200, str, 'html');
                            else callback(500, undefined, 'html');
                        });
                    } else callback(500, undefined, 'html')
                });
            });
        } catch(err) {
            debug.error(err);
            callback(404, undefined, 'html');
        }
    } else callback(405, undefined, 'html');
}

// handler for favicon request
handlers.favicon = (data, callback) => {
    if('get'.indexOf(data.method) > -1) {
    } else handlers.notFound(data, callback);
}

//handler requests to /public folder
handlers.public = (data, callback) => {
    debug.info(data);
    if('get' == data.method) {
        const trimmedFileName = data.trimmedPath.replace("public/", "").trim();
        if(trimmedFileName.length > 0) {
            helpers.getStaticAsset(trimmedFileName, (err, data) => {
                if(!err && data) {
                    var contentType = "plain";
                    if(trimmedFileName.indexOf('css') > -1) contentType == 'css';
                    if(trimmedFileName.indexOf('png') > -1) contentType == 'png';
                    if(trimmedFileName.indexOf('jpg') > -1) contentType == 'jpg';
                    if(trimmedFileName.indexOf('ico') > -1) contentType == 'favicon';
                    callback(200, data, contentType);
                } else callback(404);
            });
        } else callback(405);
    } else handlers.notFound(data, callback);
}

//request create user gui handler
handlers.createUser = (data, callback) => {
    debug.info(data);
    if('get'.indexOf(data.method) > -1) {
        const templateData = {
            'head.title': 'Create an account',
            'body.class': 'index'
        };
        helpers.getTemplate('accountCreate', templateData, (err, str) => {
            debug.info(err);
            if(!err && str) {
                debug.info(err);
                helpers.addUniversalTemplates(str, templateData, (err, str) => {
                    debug.info(err, str);
                    if(!err && str) callback(200, str, 'html');
                    else callback(500, undefined, 'html');
                });
            } else callback(500, undefined, 'html')
        });
    } else callback(405, undefined, 'html');
}

//request session create gui handler
handlers.createSession = (data, callback) => {
    if('get' == data.method) {
        const templateData = {
            'head.title': 'Login into account',
            'body.class': 'index'
        };
        helpers.getTemplate('sessionCreate', templateData, (err, str) => {
            debug.info(err);
            if(!err && str) {
                debug.info(err);
                helpers.addUniversalTemplates(str, templateData, (err, str) => {
                    debug.info(err, str);
                    if(!err && str) callback(200, str, 'html');
                    else callback(500, undefined, 'html');
                });
            } else callback(500, undefined, 'html')
        });
    } else callback(405, undefined, 'html');
}

//request for delete session request handler
handlers.deleteSession = (data, callback) => {
    if('get' == data.method) {
        const token = localStorage.getItem('token');
    }
};

//request for getting shopping card handler
handlers.shoppingCard = (data, callback) => {
    const token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.length > 0 ? data.queryStringObject.token : false;
    if('get' == data.method && token) {
        const templateData = {
            'head.title': 'Shopping card',
            'body.class': 'index'
        };
        var cardViewStr = "";
        var amountOrder = 0;
        const fillTemplateData = async () => {
            try {
                const tokenData = await _data.read('tokens', token);
                if(tokenData) {
                    const cardData = await _data.read('cards', tokenData.email);
                    if(cardData) {
                        templateData['card.info'] = JSON.stringify(cardData);
                        for(const cardItem of cardData.items) {
                            const menuData = await _data.read('menus', cardItem.menuName);
                            cardViewStr += '<tr>';
                            cardViewStr += '<td>'+cardItem.itemName+'</td>';
                            cardViewStr += '<td>'+cardItem.volume+'</td>';
                            cardViewStr += '<td>'+(cardItem.volume*menuData.items[cardItem.itemName].itemPrice)+'</td>';
                            cardViewStr += '</tr>';
                            amountOrder += cardItem.volume*menuData.items[cardItem.itemName].itemPrice;
                            debug.info(cardItem);
                        }
                    } else {
                        cardViewStr = "Shopping card is empty yet";
                    }
                }
            } catch(e) { debug.error(e); }
        };

        fillTemplateData().then(v => {
            debug.info(v);
            debug.info(cardViewStr);
            debug.info(amountOrder);
            templateData['card.items'] = cardViewStr;
            templateData['card.amount'] = amountOrder;
            debug.info(templateData);

            helpers.getTemplate('cardView', templateData, (err, str) => {
                debug.info(err);
                if(!err && str) {
                    debug.info(err);
                    helpers.addUniversalTemplates(str, templateData, (err, str) => {
                        debug.info(err, str);
                        if(!err && str) callback(200, str, 'html');
                        else callback(500, undefined, 'html');
                    });
                } else callback(500, undefined, 'html')
            });
        });
    } else handlers.notFound(data, callback);
}

//request for placing order request
handlers.placeOrder = (data, callback) => {
    if('get' == data.method) {
    } else handlers.notFound(data, callback);
}

module.exports = handlers;