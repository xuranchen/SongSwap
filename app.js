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




app.use(express.static('res'));
app.use(express.static('css'));
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
    res.send({"url" : results[0].link, "title" : results[0].title})
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
    genre.replace("/", "_")
    //check open room
    var found = false;
    var uID = null;
    firebase.database().ref('/Genres/' + genre).once('value').then(function(snapshot) {
      for (o in snapshot.val()) {
        if (snapshot.val()[o].length == 1) {
          //add to waitlist, found person
          uID = firebase.database().ref('Genres/' + genre + "/" + o).push().key
          var uList = []
          uList.push(snapshot.val()[o][0])
          uList.push(uID)
          upObj = {};
          upObj[o] = uList
          firebase.database().ref('Genres/' + genre + "/").set(upObj);
          firebase.database().ref('ActiveSessions/'+ o + '/Users').set(uList);
          found = true;
          firebase.database().ref('Users/' + uID).set(o);
          break;

        }
      }


      if (!found) {
        // add to the waitlist if no one
        var sessionID = firebase.database().ref('Genres/' + genre).push().key
        uID = firebase.database().ref('Genres/' + genre + "/" + sessionID).push().key
        var uList = []
        uList.push(uID)
        upObj = {};
        upObj[sessionID] = uList
        firebase.database().ref('Genres/' + genre).update(upObj);
        firebase.database().ref('Users/' + uID).set(sessionID);
      }
      
      res.send(uID)
    });


})

app.get('/sessionWait', function (req, res) {
  // send session html here
  res.send(waitScreenHTML(req["query"]["uID"]));
})

app.get('/sessionCheck', function (req, res) {

  var uID = req["query"]["uID"]

  var activeSession = null
  firebase.database().ref('/Users').once('value').then(function(snapshot) {
    var userIDs = snapshot.val();
    var sessionID = userIDs[uID]
    firebase.database().ref('/ActiveSessions').once('value').then(function(snappshot) {
      var sessions = snappshot.val();
      if (sessions == null) {
        res.send({"sessionID":false});
        return;
      }
      
      if (sessions != null) {
        if (typeof sessions[sessionID] != "undefined"){
          activeSession = true
          res.send({"sessionID":sessionID});
          return;
        }
      }
      res.send({"sessionID":false});
    });
  });
})

app.get('/session', function (req, res) {
  sID = req["sID"];
  uID = req["uID"]
  res.sendFile(path.join(__dirname,'chatClient.html'));

});

app.get('/send', function (req, res){
  sID = req["query"]["sID"];
  uID = req["query"]["uID"];
  vidURL = req["query"]["url"];
  vTitle = req["query"]["t"];

  nObj = [];
  nObj.push(vTitle);
  nObj.push(vidURL);
  rObj = {}
  rObj["result"] = nObj;
  firebase.database().ref('ActiveSessions/' + sID + "/" + uID).set(rObj);
  res.send({status:"success"});
});
app.get('/checkSong', function (req, res){
  sID = req["query"]["sID"];
  uID = req["query"]["uID"];
  var found = false
  firebase.database().ref('/ActiveSessions/' + sID).once('value').then(function(snapshot) {
    var entrees = snapshot.val();
    console.log(entrees);
    for (var key in entrees) {
      if (key != "Users" && key != uID) {
        //found recommendation
        found = true

        console.log(entrees[key]);
        res.send(entrees[key])
      } 
    }
    if (!found) {
      res.send({"completed": false});
    }

  });
});


app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname,'login.html'));
});

app.get('/registerRequest', function(req, res) {
    username = req.query.username
    password = req.query.password
    console.log(username)
    console.log(password)
    firebase.database().ref('/Registered').once('value').then(function(snapshot) {
        var registeredUsers = snapshot.val()
        var validUserName = true
        console.log(registeredUsers == null)
        if (registeredUsers != null) {
            for (users in registeredUsers) {
                if (users == username) {
                    validUserName = false
                    break
                }
            }
        }
        if (validUserName) {
            var x = {}
            x[username] = password
            firebase.database().ref('/Registered').update(x)
        }
        res.send({validUserName : validUserName})
    })
});

app.get('/loginrequest',  function(req, res){
    username = req.query.username
    password = req.query.password
    valid = false
    firebase.database().ref('/Registered').once('value').then(function(snapshot) {
        var registeredUsers = snapshot.val()
        if (registeredUsers != null) {
            for (user in registeredUsers) {
                if (username == user && registeredUsers[user] == password) {
                    valid = true
                }
            }
        }
        if (valid) {
            res.send({successfulLogin : true, username : username})
        } else {
            res.send({successfulLogin : false})
        }
    })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});







function waitScreenHTML (uID)  {
return `
<html>
<header>
    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

    <link rel="stylesheet" href="res/default.css">
  <script type="text/javascript">
        var uID = "` + uID + `";

        setInterval(function(){
              $.get("/sessionCheck",{"uID":uID}).done(function(data) {
                if (data["sessionID"] != false) {
                  var url = "/session";
                  url += "?sID=" + data["sessionID"] + "&uID=" + uID;
                  window.location = url;
                }
              });
        }, 3000);
      </script>

</header>
<style>

</style>
<div style="width: 100%; height: 100%">
    <div align="center" style="padding-top: 20%">
        <div class="loader">
        </div>
        <div> We are searching for a match</div>
    </div>
</div>


</html>
`
};
