var Firebase = require("firebase");
var request = require('request');
var myFirebaseRef = new Firebase("https://amber-inferno-3722.firebaseio.com/");

// Global Constants
var UNIQUE_NEW_LEADS = "Filament Metrics/Unique New Leads";
var EVAL_KITS_SOLD = "Filament Metrics/Eval Kits Sold";
var TAP_BOOKINGS = "Filament Metrics/Tap Bookings";
var TAPS_IN_OPERATION = "Filament Metrics/Taps in Operation";
var REVENUE = "Filament Metrics/Revenue";
var GECKO_API_KEY = "019bc0313f1d94dd149ae145379f8266";
var UNIQUE_NEW_LEADS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-9a0b34f7-8339-4c4d-a61f-4702ea8941cd";
var EVAL_KITS_SOLD_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-a65537dc-f494-4b4e-8955-bb51b965d19b";
var TAP_BOOKINGS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-b3182f88-c3f5-4b42-8b89-143691d67f8a";
var TAPS_IN_OPERATION_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-91a2f35e-4e4b-497e-ba58-b4196e414060";
var REVENUE_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-3b1f628f-5756-40b2-8564-e5a0410691d6";

// Main Code
listenForChangeInFirebaseMetric(UNIQUE_NEW_LEADS);
listenForChangeInFirebaseMetric(EVAL_KITS_SOLD);
listenForChangeInFirebaseMetric(TAP_BOOKINGS);
listenForChangeInFirebaseMetric(TAPS_IN_OPERATION);
listenForChangeInFirebaseMetric(REVENUE);

//****************************************************************************** 
// updateFirebase
//
// updates the values in the Firebase database for the filament metrics
//******************************************************************************

function updateFirebase(uniNewLeads, kitsSold, bookings, tapsInOp, rev) {
  myFirebaseRef.set({
    "Filament Metrics": {
      "Unique New Leads": uniNewLeads,
      "Eval Kits Sold": kitsSold,
      "Tap Bookings": bookings,
      "Taps in Operation": tapsInOp,
      "Revenue": rev
    }
  });
}

//****************************************************************************** 
// listenForChangeInFirebaseMetric
//
// Activates listner for changes in Firebase values for passed metric
//******************************************************************************

function listenForChangeInFirebaseMetric(metric) {
  myFirebaseRef.child(metric).on("value", function newValueRecieved(snapshot) {
    var newMetricValue = snapshot.val();  
    var metricLabel;
    var objectForGecko;
    var postURL;

    console.log(metric + ": " + newMetricValue);

    metricLabelAndURL = findMetricLabelAndURL(metric);
    metricLabel = metricLabelAndURL[0];
    postURL = metricLabelAndURL[1];    
    objectForGecko = createGeckoObject (newMetricValue, metricLabel);
    postToGecko (objectForGecko, postURL);
  });
}

//****************************************************************************** 
// findMetricLabelAndURL
//
// Set metric label and POST URL to match metric passed in
//******************************************************************************

function findMetricLabelAndURL (metric) {
  switch(metric) {
    case UNIQUE_NEW_LEADS:
      return ["Unique New Leads", UNIQUE_NEW_LEADS_GECKO_PUSH_URL];
    case EVAL_KITS_SOLD:
      return ["Eval Kits Sold", EVAL_KITS_SOLD_GECKO_PUSH_URL];
    case TAP_BOOKINGS:
      return ["Tap Bookings", TAP_BOOKINGS_GECKO_PUSH_URL];
    case TAPS_IN_OPERATION:
      return ["Taps in Operation", TAPS_IN_OPERATION_GECKO_PUSH_URL];
    case REVENUE:
      return ["Revenue", REVENUE_GECKO_PUSH_URL];
    default:
      console.error("ERROR in findMetricLabelAndURL: Unrecognized metric passed");
  }
}

//****************************************************************************** 
// createGeckoObject
//
// Create object to send to Geokoboard
//******************************************************************************

function createGeckoObject (newMetricValue, metricLabel) {
  var objectForGecko
  var prefix;

  // Add $ prefix for Revenue
  if (metricLabel === "Revenue") {
    prefix = "$";
  }

  return objectForGecko = {
                            "api_key": GECKO_API_KEY,
                            "data": {
                              "item": [
                                {
                                  "value": newMetricValue,
                                  "text": metricLabel,
                                  "prefix": prefix
                                }
                              ]
                            }
                          };
}

//****************************************************************************** 
// postToGecko
//
// POSTs json object to Geckoboard
//******************************************************************************

function postToGecko (objectForGecko, postURL) {
  request.post(
    postURL,
    { json: objectForGecko },
    function responseToPost (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("POST to Gecko: ", body);
        }
    }
  );
}



// // Listener for changes in Unique New Leads Field
// myFirebaseRef.child("Filament Metrics/Unique New Leads").on("value", function(snapshot) {
//   var uniqueNewLeads = snapshot.val();  
//   console.log(uniqueNewLeads);
//   var uniqueNewLeadsObject = 
//   {
//     "api_key": "019bc0313f1d94dd149ae145379f8266",
//     "data": {
//       "item": [
//         {
//           "value": uniqueNewLeads,
//           "text": "Unique New Leads"
//         }
//       ]
//     }
//   }

//   request.post(
//       'https://push.geckoboard.com/v1/send/174778-9a0b34f7-8339-4c4d-a61f-4702ea8941cd',
//       { json: uniqueNewLeadsObject },
//       function (error, response, body) {
//           if (!error && response.statusCode == 200) {
//               console.log(body)
//           }
//       }
//   );
// });

// // Listener for changes in Eval Kits Sold Field
// myFirebaseRef.child("Filament Metrics/Eval Kits Sold").on("value", function(snapshot) {
//   var evalKitsSold = snapshot.val();  
//   console.log(evalKitsSold);
//   var evalKitsSoldObject = 
//   {
//     "api_key": "019bc0313f1d94dd149ae145379f8266",
//     "data": {
//       "item": [
//         {
//           "value": evalKitsSold,
//           "text": "Eval Kits Sold"
//         }
//       ]
//     }
//   }

//   request.post(
//       'https://push.geckoboard.com/v1/send/174778-a65537dc-f494-4b4e-8955-bb51b965d19b',
//       { json: evalKitsSoldObject },
//       function (error, response, body) {
//           if (!error && response.statusCode == 200) {
//               console.log(body)
//           }
//       }
//   );
// });

// // Listener for changes in Tap Bookings Field
// myFirebaseRef.child("Filament Metrics/Tap Bookings").on("value", function(snapshot) {
//   var tapBookings = snapshot.val();  
//   console.log(tapBookings);
//   var tapBookingsObject = 
//   {
//     "api_key": "019bc0313f1d94dd149ae145379f8266",
//     "data": {
//       "item": [
//         {
//           "value": tapBookings,
//           "text": "Tap Bookings"
//         }
//       ]
//     }
//   }

//   request.post(
//       'https://push.geckoboard.com/v1/send/174778-b3182f88-c3f5-4b42-8b89-143691d67f8a',
//       { json: tapBookingsObject },
//       function (error, response, body) {
//           if (!error && response.statusCode == 200) {
//               console.log(body)
//           }
//       }
//   );
// });