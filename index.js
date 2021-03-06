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
var NEW_LEADS_LAST_24 = "Filament Metrics/New Leads in Last 24 Hours";
var UNIQUE_NEW_LEADS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-9a0b34f7-8339-4c4d-a61f-4702ea8941cd";
var EVAL_KITS_SOLD_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-a65537dc-f494-4b4e-8955-bb51b965d19b";
var TAP_BOOKINGS_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-b3182f88-c3f5-4b42-8b89-143691d67f8a";
var TAPS_IN_OPERATION_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-91a2f35e-4e4b-497e-ba58-b4196e414060";
var REVENUE_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-3b1f628f-5756-40b2-8564-e5a0410691d6";
var NEW_LEADS_LAST_24_GECKO_PUSH_URL = "https://push.geckoboard.com/v1/send/174778-29f577d5-6536-4cc2-a53b-ba34ee9050af";
var LEAD_MAP_URL = "https://push.geckoboard.com/v1/send/174778-56aa3d39-248c-4fd6-ac46-2a86ed599881";

// Global Variables
var completedCount = 0 // Count of completed updates
var d = new Date();
var currentTime = d.getTime()
var oneDayInMilliseconds = 86400000;
var lastLeadsInLast24Hours;
var trendTestArray =     
  [
    "38594",
    "39957",
    "35316",
    "35913",
    "36668",
    "45660",
    "42949",
    "47949",
  ];
var newLeads24TrendArray = []; // Array to hold past values of nnew leads
var uniNewLeadsTrendArray = [];
var evalKitsSoldTrendArray = [];
var tapBookingsTrendArray = [];
var tapsInOperationTrendArray = [];
var revenueTrendArray = [];

// Main Code
//updateFirebase(25, 5, 10, 15, 1000000);
//http.createServer(function (request, response) {}).listen(process.env.PORT);

listenForChangeInFirebaseMetric(UNIQUE_NEW_LEADS);
listenForChangeInFirebaseMetric(EVAL_KITS_SOLD);
listenForChangeInFirebaseMetric(TAP_BOOKINGS);
listenForChangeInFirebaseMetric(TAPS_IN_OPERATION);
listenForChangeInFirebaseMetric(REVENUE);
listenForChangeInFirebaseMetric(NEW_LEADS_LAST_24 );
//updateNewLeadsInLast24HoursTestFunction();
//updateLeadMap();

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
    //myFirebaseRef.child(metric).off("value");
    var newMetricValue = snapshot.val();  
    var metricLabel;
    var objectForGecko;
    var postURL;
    var trendArray

    // console.log(metric + ": " + newMetricValue);

    var metricLabelAndURL = findMetricLabelTrendArrayAndURL(metric);
    // if (leadsInLast24Hours != lastLeadsInLast24Hours && lastLeadsInLast24Hours != undefined) {
    //   newLeads24TrendArray.push(lastLeadsInLast24Hours.toString())
    // }
    metricLabel = metricLabelAndURL[0];
    postURL = metricLabelAndURL[1];  
    trendArray = metricLabelAndURL[2];  
    objectForGecko = createGeckoNumberTrendObject (newMetricValue, metricLabel, trendArray);
    postToGecko (objectForGecko, postURL);
    trendArray.push(newMetricValue);
  });
}

//****************************************************************************** 
// findMetricLabelTrendArrayAndURL
//
// Set metric label and POST URL to match metric passed in
//******************************************************************************

function findMetricLabelTrendArrayAndURL (metric) {
  switch(metric) {
    case UNIQUE_NEW_LEADS:
      return ["Unique New Leads", UNIQUE_NEW_LEADS_GECKO_PUSH_URL, uniNewLeadsTrendArray];
    case EVAL_KITS_SOLD:
      return ["Eval Kits Sold", EVAL_KITS_SOLD_GECKO_PUSH_URL, evalKitsSoldTrendArray];
    case TAP_BOOKINGS:
      return ["Tap Bookings", TAP_BOOKINGS_GECKO_PUSH_URL, tapBookingsTrendArray];
    case TAPS_IN_OPERATION:
      return ["Taps in Operation", TAPS_IN_OPERATION_GECKO_PUSH_URL, tapsInOperationTrendArray];
    case REVENUE:
      return ["Revenue", REVENUE_GECKO_PUSH_URL, revenueTrendArray];
    case NEW_LEADS_LAST_24:
      return ["New Leads in Last 24 Hours", NEW_LEADS_LAST_24_GECKO_PUSH_URL, newLeads24TrendArray]
    default:
      console.error("ERROR in findMetricLabelTrendArrayAndURL: Unrecognized metric passed");
  }
}

//****************************************************************************** 
// createGeckoObject
//
// Create object to send to Geokoboard
//******************************************************************************

function createGeckoNumberTrendObject (newMetricValue, metricLabel, trendArray) {
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
                                },
                                trendArray
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
        // if (completedCount >= 6) {
        //   process.exit();
        // }
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
  var leadsInLast24Hours = 0;

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
      if (leadsInLast24Hours != lastLeadsInLast24Hours) {
        newLeads24sTrendArray.push(lastLeadsInLast24Hours.toString())
      }
      console.log("New Leads in Last 24 Hours:", leadsInLast24Hours);
      metricLabelAndURL = findMetricLabelTrendArrayAndURL(NEW_LEADS_LAST_24);
      metricLabel = metricLabelAndURL[0];
      postURL = metricLabelAndURL[1];    
      objectForGecko = createGeckoNumberTrendObject (leadsInLast24Hours, metricLabel);
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
  var ips = [];
  var i = 0, j = 0, k = 0, l = 0;
  for (i = 0; i < 256; i++) {
    //ips.push( {"ip": i.toString() + "." + j.toString() + "." + k.toString() + "." + l.toString()} ); 
    for (j = 0; j < 256; j++) {
      ips.push( {"ip": i.toString() + "." + j.toString() + "." + k.toString() + "." + l.toString()} ); 
      //for (k = 0; k < 256; k++) {
        //ips.push( {"ip": i.toString() + "." + j.toString() + "." + k.toString() + "." + l.toString()} ); 
    //         for (l = 0; l < 256; l++) {
    //           ips.push( {"ip": i.toString() + "." + j.toString() + "." + k.toString() + "." + l.toString()} ); 
    //         }
      
    }
  }

  console.log(ips);
  var geckoTestMapObject = 
    {
      "api_key": GECKO_API_KEY,
      "data": {
        "points": {
          "point": ips

            // {
            //   "city": {
            //     "city_name": "London",
            //     "country_code": "GB"
            //   },
            //   "size": 10
            // },
            // {
            //   "city": {
            //     "city_name": "London",
            //     "country_code": "GB"
            //   },
            //   "size": 10
            // },
            // {
            //   "city": {
            //     "city_name": "San Francisco",
            //     "country_code": "US",
            //     "region_code": "CA"
            //   }
            // },
            // {
            //   "latitude": "22.2670",
            //   "longitude": "114.1880",
            //   "color": "d8f709"
            // },
            // {
            //   "latitude": "-33.94336",
            //   "longitude": "18.896484",
            //   "size": 5
            // },
            // {
            //   "host": "geckoboard.com",
            //   "color": "77dd77",
            //   "size": 6
            // },

          //   {
          //     "ip": "1.0.0.0"
          //   },
          //   {
          //     "ip": "2.0.0.0"
          //   },
          //   {
          //     "ip": "3.0.0.0"
          //   },
          //   {
          //     "ip": "4.0.0.0"
          //   },
          //   {
          //     "ip": "5.0.0.0"
          //   }
          // ]
        }
      }
    };
  postToGecko (geckoTestMapObject, LEAD_MAP_URL);
}

//****************************************************************************** 
// updateNewLeadsInLast24HoursTestFunction
//
// Calculates # of new leads on Intercom and updates count of Geckoboard
// Created for use without intercom link
//******************************************************************************

function updateNewLeadsInLast24HoursTestFunction () {
  var metricLabel;
  var objectForGecko;
  var postURL;

  myFirebaseRef.child(NEW_LEADS_LAST_24).on("value", function newValueRecieved(snapshot) {
    var leadsInLast24Hours = snapshot.val();  
    console.log(leadsInLast24Hours);
    var metricLabel;
    var objectForGecko;
    var postURL;

    if (leadsInLast24Hours != lastLeadsInLast24Hours && lastLeadsInLast24Hours != undefined) {
      newLeads24TrendArray.push(lastLeadsInLast24Hours.toString())
    }
    lastLeadsInLast24Hours = leadsInLast24Hours;
    metricLabelAndURL = findMetricLabelTrendArrayAndURL(NEW_LEADS_LAST_24);
    metricLabel = metricLabelAndURL[0];
    postURL = metricLabelAndURL[1];    
    objectForGecko = createGeckoNumberTrendObject (leadsInLast24Hours, metricLabel, newLeads24TrendArray);
    postToGecko (objectForGecko, postURL);
    console.log("newLeads24TrendArray", newLeads24TrendArray);
  });
}
