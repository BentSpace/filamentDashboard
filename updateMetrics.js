var Firebase = require("firebase");
// var request = require("request");
var myFirebaseRef = new Firebase("https://amber-inferno-3722.firebaseio.com/");

function displayMenu() {
  console.log(
    "Welcome to Filament Metrics Update Utility \n\n

    1. 
    ");
}

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