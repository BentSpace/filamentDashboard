// #! /app/bin/node
var http = require("http");
var Firebase = require("firebase");
var request = require("request");
var myFirebaseRef = new Firebase("https://amber-inferno-3722.firebaseio.com/");

//For Intercom API
var Intercom = require('intercom-client');
var client = new Intercom.Client('aya2xns2', 'b8c906c84711b31d7e6aa0af375899afe7b985ae');

// For Gecko API
var GECKO_API_KEY = "019bc0313f1d94dd149ae145379f8266";

// Global Constants
var UNIQUE_NEW_LEADS = "Filament Metrics/Unique New Leads";
var EVAL_KITS_SOLD = "Filament Metrics/Eval Kits Sold";
var TAP_BOOKINGS = "Filament Metrics/Tap Bookings";
var TAPS_IN_OPERATION = "Filament Metrics/Taps in Operation";
var REVENUE = "Filament Metrics/Revenue";
var UNIQUE_NEW_LEADS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-9a0b34f7-8339-4c4d-a61f-4702ea8941cd";
var EVAL_KITS_SOLD_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-a65537dc-f494-4b4e-8955-bb51b965d19b";
var TAP_BOOKINGS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-b3182f88-c3f5-4b42-8b89-143691d67f8a";
var TAPS_IN_OPERATION_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-91a2f35e-4e4b-497e-ba58-b4196e414060";
var REVENUE_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-3b1f628f-5756-40b2-8564-e5a0410691d6";
var NEW_LEADS_LAST_24_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-29f577d5-6536-4cc2-a53b-ba34ee9050af";

// Global Variables
var completedCount = 0 // Count of completed updates
var d = new Date();
var currentTime = d.getTime()
var oneDayInMilliseconds = 86400000;
var leadsInLast24Hours = 0;

// Main Code
//updateFirebase(25, 5, 10, 15, 1000000);
//http.createServer(function (request, response) {}).listen(process.env.PORT);
listenForChangeInFirebaseMetric(UNIQUE_NEW_LEADS);
listenForChangeInFirebaseMetric(EVAL_KITS_SOLD);
listenForChangeInFirebaseMetric(TAP_BOOKINGS);
listenForChangeInFirebaseMetric(TAPS_IN_OPERATION);
listenForChangeInFirebaseMetric(REVENUE);
updateNewLeadsInLast24Hours();
//checkForCompletion();

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
    myFirebaseRef.child(metric).off("value");
    var newMetricValue = snapshot.val();  
    var metricLabel;
    var objectForGecko;
    var postURL;

    // console.log(metric + ": " + newMetricValue);

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
    case NEW_LEADS_LAST_24:
      return ["New Leads in Last 24 Hours", NEW_LEADS_LAST_24_GECKO_PUSH_URL]
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
      if (error) {
        console.error("Error in post to Gecko", error);
      }
      else {
        completedCount ++;
        if (completedCount >= 6) {
          process.exit();
        }
      }
    }
  );
}

//****************************************************************************** 
// updateNewLeadsInLast24Hours
//
// Calculates # of new leads on Intercom and updates count of Geckoboard
//******************************************************************************

function updateNewLeadsInLast24Hours () {
  var metricLabel;
  var objectForGecko;
  var postURL;

  client.leads.list(function leadsListReturned (err, response) {
    if (err) {
      console.error("Error in getting List of Leads:\n", err.body.errors);
    }
    else {
      var totalNumberOfLeads = response.body.contacts.length;
      for (i = 0; i < totalNumberOfLeads; i++) {
        var leadCreationTime = response.body.contacts[i].created_at * 1000;
        var diffCreateAndCurrent = currentTime - leadCreationTime;
        console.log("leadCreationTime: ", leadCreationTime);
        console.log("Difference leadCreationTime: ", diffCreateAndCurrent);
        if (diffCreateAndCurrent < oneDayInMilliseconds) {
          console.log("Less Than 24 hours old");
          leadsInLast24Hours++;
        }
      }
      console.log("New Leads in Last 24 Hours:", leadsInLast24Hours);
      metricLabelAndURL = findMetricLabelAndURL(NEW_LEADS_LAST_24);
      metricLabel = metricLabelAndURL[0];
      postURL = metricLabelAndURL[1];    
      objectForGecko = createGeckoObject (leadsInLast24Hours, metricLabel);
      postToGecko (objectForGecko, postURL);
    }
  });
}

//*****************************************************************************= 
// updateLeadMap
//
// updates the Lead map
//*****************************************************************************=
function updateLeadMap(){
  var geckoTestMapObject = 
    {
      "api_key": GECKO_API_KEY,
      "data": {
        "points": {
          "point": [
            {
              "city": {
                "city_name": "London",
                "country_code": "GB"
              },
              "size": 10
            },
            {
              "city": {
                "city_name": "San Francisco",
                "country_code": "US",
                "region_code": "CA"
              }
            },
            {
              "latitude": "22.2670",
              "longitude": "114.1880",
              "color": "d8f709"
            },
            {
              "latitude": "-33.94336",
              "longitude": "18.896484",
              "size": 5
            },
            {
              "host": "geckoboard.com",
              "color": "77dd77",
              "size": 6
            },
            {
              "ip": "178.125.193.227"
            }
          ]
        }
      }
    };
  postToGecko (geckoTestMapObject, LEAD_MAP_URL);
}
