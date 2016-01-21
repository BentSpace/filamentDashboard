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

myFirebaseRef.child("Filament Metrics/Unique New Leads").on("value", function(snapshot) {
  var uniqueNewLeads = snapshot.val();  // Alerts "San Francisco"
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