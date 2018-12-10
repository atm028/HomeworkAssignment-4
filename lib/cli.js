const readLine = require('readline');
const events = require('events');
const _data = require('./data');

class _events extends events{};
var e = new _events();

var cli = {};

//supported commands
cli.commands = {
    "items": "View all the current menu items",
    "orders": "View all the recent orders in the system (orders placed in the last 24 hours)",
    "order": "Lookup the details of a specific order by order ID",
    "users": "View all the users who have signed up in the last 24 hours",
    "user": "Lookup the details of a specific user by email address",
    "help": "this help",
    "exit": "stop the application"
};

//init procedure for cli
cli.init = () => {
    console.log("CLI Init");
    var _interface = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });

    _interface.prompt();
    _interface.on('line', (str) => {
        cli.processInput(str);
        _interface.prompt();
    });
    _interface.on('close', () => { process.exit(0); });
};

//input handler
cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    if(str) {
        var match = false;
        Object.keys(cli.commands).some((input) => {
            if(str.toLowerCase().indexOf(input) > -1) {
                match = true;
                e.emit(input, str);
                return true;
            }
        });
        if(!match) console.log('Unknown command');
    }
};

//draw horizontal line
cli.horizontalLine = () => {
    var width = process.stdout.columns;
    var line = '';
    for(var i = 0; i < width; i++) line += '-';
    console.log(line);
};

//printing out the string in the center of the screen
cli.centered = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str : false;
    if(str) {
        var width = process.stdout.colimns;
        var leftPadding = Math.floor((width - str.length) / 2);
        var line = '';
        for(var i = 0; i < leftPadding; i++) line += ' ';
        line += str;
        console.log(line);
    }
};

//insert vertical spaces
cli.verticalSpace = (n) => {
    n = typeof(n) == 'number' && n > 0 ? n : false;
    if(n) {
        for(var i = 0; i < n; i++) console.log('');
    }
};

//command responders
cli.responders = {};
e.on("items",   async (str) => { await cli.responders.listItems(str); });
e.on("orders",  async (str) => { await cli.responders.listOrders(str); });
e.on("order",   async (str) => { await cli.responders.infoOrder(str); });
e.on("users",   async (str) => { await cli.responders.listUsers(str); });
e.on("user",    async (str) => { await cli.responders.infoUser(str); });
e.on("help",    async (str) => { await cli.responders.help(str); });
e.on("exit",    async (str) => { await cli.responders.exit(str); });


//list of menu items responder
cli.responders.listItems = async (str) => {
    var argv = str.split(" ");
    argv[1] = typeof(argv[1]) !== 'undefined' && argv[1].length > 0 ? argv[1] : 'test_menu';
    try {
        const data = await _data.read('menus', argv[1]);
        if(data) {
            cli.horizontalLine();
            cli.centered("Menu: "+data.name);
            cli.horizontalLine();
            for(const item in data.items) {
                cli.centered(item+" : "+data.items[item].itemPrice);
            }
            cli.horizontalLine();
        }
    } catch(e) { console.log(e); }
};

//list of orders responder
cli.responders.listOrders = async (str) => {
    try {
        const files = await _data.list('orders');
        const moment = Date.now() - (1000*60*60*24);
        cli.horizontalLine();
        cli.centered("ORDERS");
        cli.horizontalLine();
        for(const file of files) {
            const splitName = file.split("_");
            if(splitName.length > 1) {
                const strOrderDate = splitName.pop().split(".");
                if(strOrderDate.length >= 1 && parseInt(strOrderDate[0]) > moment) {
                    const data = await _data.read('orders', file);
                    if(data) {
                        const date = new Date(data.date);
                        console.log(data.orderId+" : "+data.name+" : "+date);
                    }
                }
            }
        }
        cli.horizontalLine();
    } catch(e) {
        console.log(e);
    }
};

//order info responder
cli.responders.infoOrder = async (str) => {
    const argv = str.split(" ");
    argv[1] = typeof(argv[1]) !== 'undefined' && argv[1].length > 1 ? argv[1] : false;
    var found = false;
    if(argv[1]) {
        const files = await _data.list('orders');
        for(const file of files) {
            if(file.indexOf(argv[1]) > -1) {
                found = file;
                break;
            }
        }
        if(found) {
            try {
                const data = await _data.read('orders', found);
                if(data) {
                    cli.horizontalLine();
                    cli.centered("ORDER: "+argv[1]);
                    cli.horizontalLine();

                    const date = new Date(data.date);
                    cli.centered(data.name+":"+date);
                    cli.centered("Menu name - item name: volume : price");
                    var amount = 0;
                    for(const item of data.items) {
                        //TODO: menu data should be cached
                        const menuData = await _data.read('menus', item.menuName);
                        if(menuData) {
                            const price = menuData.items[item.itemName].itemPrice;
                            cli.centered(item.menuName+" - "+item.itemName+" : "+item.volume+" : "+price);
                            amount += item.volume*price;
                        } else {
                            cli.centered(item.menuName+" - "+item.itemName+" : "+item.volume+" : None");
                        }
                    }
                    console.log("Amount: $"+amount);
                    cli.horizontalLine();
                } else { console.log("Cannot read the file of order with orderId = "+found); }
            } catch(e) { console.log(e); }
        } else { console.log("No such order: ", argv[1]); }
    } else { console.log("The orderId is required"); }
};

//list of users responder
cli.responders.listUsers = async (str) => {
    const files = await _data.list('users');
    const moment = Date.now() - (1000*60*60*24);
    for(const file of files) {
        const userData = await _data.read('users', file);
        if(userData && userData.date > moment)
            console.log(userData.email);
    }
};

//user info responder
cli.responders.infoUser = async (str) => {
    const argv = str.split(" ");
    argv[1] = typeof(argv[1]) !== 'undefined' && argv[1].length > 1 ? argv[1] : false;
    if(argv[1]) {
        try {
            const data = await _data.read('users', argv[1]);
            if(data) {
                cli.horizontalLine();
                cli.centered(data.email+" : "+data.firstName+" "+data.lastName);
                cli.horizontalLine();
            }
        } catch(e) { console.log("No such user: "+e.path.split("/").pop().split(".")[0]); }
    } else { console.log("User ID required"); }
};

//help responder
cli.responders.help = async (str) => {
    cli.horizontalLine();
    cli.centered("HELP");
    cli.horizontalLine();
    for(const k in cli.commands) console.log(k+": "+cli.commands[k]);
    cli.horizontalLine();
};

//exit reposnder
cli.responders.exit = async (str) => {
    process.exit(0);
};



module.exports = cli;
