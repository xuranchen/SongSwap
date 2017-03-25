var express = require('express')
var app = express()
var firebase = require('firebase');
const path = require('path');

var config = {
    apiKey: "AIzaSyC1A2JD5DV8lIMNMUcfK9e5G4sgTeZ02fY",
    authDomain: "songswap-69eb8.firebaseapp.com",
    databaseURL: "https://songswap-69eb8.firebaseio.com",
    storageBucket: "songswap-69eb8.appspot.com",
    messagingSenderId: "198525626402"
  };

firebase.initializeApp(config);




app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname,'index.html'));


//   firebase.database().ref('users/' + "varun").update({
//     "ddd": "f"
//   });
})

app.get('/join', function (req, res) {
    // waiting gif
    // reqest = {userID: ,

    var genre;
    try {
      genre = req['query']['genre']
    } catch (e) {
      console.log(e);
    }
    //res.send(Date.now().toString())
    // create entry in firebase for given genre
})

app.get('/sessionWait', function (erq, res) {
  // send session html here
  res.send
  res.send();

})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})





