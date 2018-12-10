var environments = {};

environments.staging = {
    'envName': 'staging',
    'httpPort': 3000,
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid': '',
        'authToken': '',
        'fromemail': ''
    },
    'stripe': {
        'public_key': 'PUBLIC_KEY',
        'secret_key': 'SECRET_KEY'
    },
    'mailgun': {
        'apiKey': 'API_KEY',
        'domain': 'DOMAIN',
        'from': 'FROM'
    },
    'templateGlobals' : {
        'appName' : 'UptimeChecker',
        'companyName' : 'NotARealCompany, Inc.',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:3000/'
    }
};

environments.production = {
    'envName': 'production',
    'httpPort': 5002,
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5
};

var currEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var envToExport = typeof(environments[currEnv]) == 'object' ? environments[currEnv] : environments.staging;

module.exports = envToExport;