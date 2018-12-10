const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const _data = require('./data');
const path = require('path');
const fs = require('fs');
const debug = require('./debug');

var helpers = {};

/**
 * form response object
 * @return: json object with responce parameters
 * @required_params: 
 *  - code - status code
 *  - message body
 *  - type - content type
 * @optional_params: None
 */
helpers.formResponce = (code, body, type) => {
   return {'code': code, 'body': body, 'type': type};
}

/**
 * encode string with hash function
 * @return: hash value
 * @required_params: 
 *  - str - string to be hashed
 * @optional_params: None
 */
helpers.hash = (str) => {
    if(typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

/**
 * Build json object from string
 * @return: json object
 * @required_params: 
 *  - str - json object in string format
 * @optional_params: None
 */
helpers.parseJsonToObject = (str) => {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch {
        return {};
    }
};

/**
 * generate random string
 * @return: string
 * @required_params: 
 *  - length - integer, required length of the random string
 * @optional_params: None
 */
helpers.createRandomString = (length) => {
    length = typeof(length) == 'number' && length > 0 ? length : 10;
    var posChars = 'abcdefgijklmnopqrstuwvwxyz01234567890';
    var str = '';
    for(i = 1; i <= length; i++) {
        str += posChars.charAt(Math.floor(Math.random() * posChars.length));
    }
    return str;
};

/**
 * sending emial message
 * @return: list of json files
 * @required_params: 
 *  - to - message recipient
 *  - subj - message subject
 *  - msg - message body
 *  - callback - callback function
 * @optional_params: None
 */
helpers.sendEmail = (to, subj, msg, callback) => {
    const payload = {
        'to': to,
        'from': config.mailgun.from,
        'subject': subj,
        'text': msg
    };
    const strPayload = querystring.stringify(payload);
    const reqOptions = {
        'protocol': 'https:',
        'hostname': 'api.mailgun.net',
        'auth': ['api', config.mailgun.apiKey].join(":"),
        'port': 443,
        'method': 'POST',
        'path': '/v3/'+config.mailgun.domain+'/messages',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(strPayload)
        }
    };
    const req = https.request(reqOptions, (res) => {
        const statusCode = res.statusCode;
        if(200 == statusCode || 201 == statusCode) callback(false, res);
        else callback(true, res);
    });
    req.on('error', (err) => callback(true, err));
    req.write(strPayload);
    req.end();
};

/**
 * sending emial message
 * @return: list of json files
 * @required_params: 
 *  - to - message recipient
 *  - subj - message subject
 *  - msg - message body
 *  - callback - callback function
 * @optional_params: None
 */
// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = function(templateName,data,callback) {
  debug.info(data);
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    debug.info(templatesDir+templateName+'.html');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

/**
 * Add the universal header and footer to a string, 
 * and pass provided data object to header and footer for interpolation
 * @return: complete document
 * @required_params: 
 *  - str - the document content should be covered with header and footer
 *  - data - document's, header's and footer's variables
 *  - callback - callback function
 * @optional_params: None
 */
helpers.addUniversalTemplates = function(str,data,callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};
  // Get the header
  helpers.getTemplate('_header',data,function(err,headerString){
    if(!err && headerString){
      // Get the footer
      helpers.getTemplate('_footer',data,function(err,footerString){
        if(!err && headerString){
          // Add them all together
          var fullString = headerString+str+footerString;
          callback(false,fullString);
        } else {
          callback('Could not find the footer template');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

/**
 * Take a given string and data object, and find/replace all the keys within it
 * @return: formed document with values from variables
 * @required_params: 
 * - str - document template
 * - data - variables where should be inserted into template
 * @optional_params: None
 */
helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
     if(config.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

/**
 * Get the contents of a static (public) asset
 * @return: content of template
 * @required_params: 
 * - fileName - template name
 * - callback - callback function
 * @optional_params: None
 */
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};


module.exports = helpers;