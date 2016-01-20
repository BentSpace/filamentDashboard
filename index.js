var Firebase = require("firebase");
var myFirebaseRef = new Firebase("https://amber-inferno-3722.firebaseio.com/");

myFirebaseRef.set({
  "Filament Metrics": {
    "Unique New Leads": 10,
    "Eval Kits Sold": 2,
    "Tap Bookings": 3,
    "Taps in Operation": 5,
    "Revenue": 100000
  }
});

// myFirebaseRef.child("location/city").on("value", function(snapshot) {
//   console.log(snapshot.val());  // Alerts "San Francisco"
// });