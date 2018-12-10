const server = require('./lib/server');
const cli = require('./lib/cli');

app = {};

app.init = () => {
    server.init();
    cli.init();
};

app.init();

module.exports = app;