var Firebase = require("firebase");
var request = require('request');
var myFirebaseRef = new Firebase("https://amber-inferno-3722.firebaseio.com/");

// To set firbase data
myFirebaseRef.set({
  "Filament Metrics": {
    "Unique New Leads": 10,
    "Eval Kits Sold": 2,
    "Tap Bookings": 3,
    "Taps in Operation": 5,
    "Revenue": 100000
  }
});

// Listener for changes in Unique New Leads Field
myFirebaseRef.child("Filament Metrics/Unique New Leads").on("value", function(snapshot) {
  var uniqueNewLeads = snapshot.val();  
  console.log(uniqueNewLeads);
  var uniqueNewLeadsObject = 
  // {
  //   "item": [
  //     {
  //       "value": uniqueNewLeads,
  //       "text": "Unique New Leads"
  //     }
  //   ]
  // }
  {
    "api_key": "019bc0313f1d94dd149ae145379f8266",
    "data": {
      "item": [
        {
          "value": uniqueNewLeads,
          "text": "Unique New Leads"
        }
      ]
    }
  }

  request.post(
      'https://push.geckoboard.com/v1/send/174778-9a0b34f7-8339-4c4d-a61f-4702ea8941cd',
      { json: uniqueNewLeadsObject },
      function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log(body)
          }
      }
  );
});

// Listener for changes in Eval Kits Sold Field
myFirebaseRef.child("Filament Metrics/Eval Kits Sold").on("value", function(snapshot) {
  var evalKitsSold = snapshot.val();  
  console.log(evalKitsSold);
  var evalKitsSoldObject = 
  // {
  //   "item": [
  //     {
  //       "value": uniqueNewLeads,
  //       "text": "Unique New Leads"
  //     }
  //   ]
  // }
  {
    "api_key": "019bc0313f1d94dd149ae145379f8266",
    "data": {
      "item": [
        {
          "value": evalKitsSold,
          "text": "Eval Kits Sold"
        }
      ]
    }
  }

  request.post(
      'https://push.geckoboard.com/v1/send/174778-a65537dc-f494-4b4e-8955-bb51b965d19b',
      { json: evalKitsSoldObject },
      function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log(body)
          }
      }
  );
});