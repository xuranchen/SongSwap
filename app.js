var express = require('express')
var app = express()
var firebase = require('firebase');
const path = require('path');

app.use(express.static('res'))


var search = require('youtube-search');

var opts = {
  type : 'video',
  maxResults: 1,
  key: 'AIzaSyBVqz1ZchMm4adFEB9d2EX5fe7LFugjfPo'
};

var config = {
    apiKey: "AIzaSyC1A2JD5DV8lIMNMUcfK9e5G4sgTeZ02fY",
    authDomain: "songswap-69eb8.firebaseapp.com",
    databaseURL: "https://songswap-69eb8.firebaseio.com",
    storageBucket: "songswap-69eb8.appspot.com",
    messagingSenderId: "198525626402"
  };

firebase.initializeApp(config);

console.log(firebase.database().ref('test/' + "test").push().key)



app.use(express.static('res'));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname,'index.html'));
})

app.get('/main', function (req, res) {
  res.sendFile(path.join(__dirname,'chatClient.html'));
})
app.get('/search', function(req, res) {
    search(req.query.songName + " " + req.query.artistName, opts, function(err, results) {
        if(err) return console.log(err);
    console.log(results[0].link)
    console.log(results)
  res.send(results[0].link)
});
})

app.get('/join', function (req, res) {
    // waiting gif
    // reqest = {userID: ,

    var genre;
    try {
      genre = req['query']['genre']
    } catch (e) {
      res.send("Error 404")
    }
    //check open room
    res.send("Error")
    firebase.database().ref('/Genres/' + genre).once('value').then(function(snapshot) {
      console.log(snapshot.val());
      for (o in snapshot.val()) {
        console.log(o);
      }
      // add to the waitlist
      var sessionID = firebase.database().ref('Genres/' + genre).push().key
      var uID = firebase.database().ref('Genres/' + genre + "/" + sessionID).push().key
      var uList = []
      uList.push(uID)
      upObj = {};
      upObj[sessionID] = uList
      firebase.database().ref('Genres/' + genre).update(upObj);

      // add to users list
      firebase.database().ref('Users/' + uID).set(sessionID);


    });


})

app.get('/sessionWait', function (erq, res) {
  // send session html here

  res.sendFile(path.join(__dirname,'waitPage.html'));
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
