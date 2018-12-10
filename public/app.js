/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken' : false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){
  console.log(app.config.sessionToken.id);
  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

app.setLoggedInClass = (add) => {
  var target = document.querySelector("body");
  if(add) target.classList.add('loggedIn');
  else target.classList.remove('loggedIn');
  const menu = document.getElementById("mainMenu");
  const menuItems = menu.getElementsByTagName('li');
  for(var i = 0; i < menuItems.length; i++) {
    var inner = menuItems[i].getElementsByTagName('a')[0].href;
    menuItems[i].getElementsByTagName('a')[0].href=inner+"?token="+app.config.sessionToken;
  }
};


// Bind the forms
app.bindForms = () => {
  document.querySelector("form").addEventListener("submit", function(e){
    // Stop it from submitting
    e.preventDefault();
    var formId = this.id;
    var path = this.action;
    var method = this.method.toUpperCase();

    // Hide the error message (if it's currently shown due to a previous error)
    document.querySelector("#"+formId+" .formError").style.display = 'hidden';

    // Turn the inputs into a payload
    var payload = {};
    var elements = this.elements;
    for(var i = 0; i < elements.length; i++){
      if(elements[i].type !== 'submit'){
        var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
        payload[elements[i].name] = valueOfElement;
      }
    }

    // Call the API
    app.client.request(undefined,path,method,undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode !== 200){

        // Try to get the error from the api, or set a default error message
        var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = error;

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        // If successful, send to form response processor
        app.formResponseProcessor(formId,payload,responsePayload);
      }

    });
  });
};

//Binding for logout button
app.bindLogoutButton = () => {
  document.getElementById("logoutButton").addEventListener('click', () => {
    var token = localStorage.getItem('token');
    token = typeof(token) == 'string' &&
            token && token.length > 0 ? token : false;

    if(token) {
      const queryStringObject = {
        'id': token
      };
      app.client.request(undefined, 'api/tokens', "DELETE", queryStringObject, undefined, (err, res) => {
        app.setSessionToken(false);
        window.location = '/';
      });
    }
  });
};

//wrapper under getting session token from the local storage
app.getSessionToken = () => {
  console.log("getSessionToken");
  const token = localStorage.getItem('token');
  console.log(token);
  if(typeof(token) == 'string' && token && token.length > 0) {
    app.config.sessionToken = token;
    app.setLoggedInClass(true);
  } else {
    app.config.sessionToken = false;
    app.setLoggedInClass(false);
  }
  if(token === 'false' || token == false) {
    app.config.sessionToken = false;
    app.setLoggedInClass(false);
  }
};

//wrapper under the setting the session token into the local storage
app.setSessionToken = (token) => {
  app.config.sessionToken = token;
  localStorage.setItem('token', token);
  if(token) app.setLoggedInClass(true);
  else app.setLoggedInClass(false);
};


// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  if(formId == 'accountCreate') {
    window.location = "/";
  }
  if(formId == 'sessionCreate') {
    try {
      app.setSessionToken(responsePayload.id);
    } catch(e) {
      app.setSessionToken(false);
    }
    window.location = "/";
  }
  if(formId == 'cardViewForm') {
    var token = localStorage.getItem('token');
    token = typeof(token) == 'string' &&
            token && token.length > 0 ? token : false;

    if(token) {
      const req = JSON.parse(requestPayload.redirect);
      const payload = {
        "email": req.by,
        "orderName": req.name,
        "cardItems": [req.name],
        "token": token
      };
      app.client.request(undefined, 'api/orders', 'POST', undefined, payload, (err, res) => {
        console.log("ORDER POST DONE", err, res);
      });
    }
    //window.location = "/";
  }
};

// Init (bootstrapping)
app.init = function(){
  console.log("App init");
  app.getSessionToken();
  app.bindLogoutButton();
  // Bind all form submissions
  app.bindForms();
};

placeOrderButtonHandler = function(menuItems) {
  for(const k of menuItems)
    console.log(k);
};

//handler for add to shopping card button
addToCardButtonHandler = (itemName, itemPrice) => {
  const token = localStorage.getItem('token');
  if(token) {
    const queryStringObject = {
      'id': token
    };
    app.client.request(undefined, 'api/tokens', "GET", queryStringObject, undefined, (err, res) => {
      if(err == 200) {
        const payload = {
          'email': res.email,
          'cardName': res.email,
          'token': token,
          'cardItems': [{
            'menuName': 'test_menu',
            'itemName': itemName,
            'volume': 1
          }] 
        };
        app.client.request(undefined, 'api/cards', 'POST', undefined, payload, (err, res) => {
          console.log(err, res);
        });
      }
    });
  }
};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};
