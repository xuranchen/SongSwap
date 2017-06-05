var express = require('express')
var app = express()
var session = require("client-sessions");
var server = require('http').createServer(app);
const path = require('path');
var io = require('socket.io')(server);
var randomstring = require('randomstring');

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';
function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

//permissions --
var IRREGULAR_ENTRY = false;



app.use(express.static('res'))
var search = require('youtube-search');

var db = require('./db');

app.use(session({
  cookieName: 'session',
  secret: "123jdfhj234uhplzbbno",
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

// Connection URL
var url = 'mongodb://localhost:27017/user';
//mongo connect
db.connect(url, function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    server.listen(3000, function() {
      console.log('Listening on port 3000...')
    })
  }
})

  app.get('/', function(req, res) {
      //set initial cookies 
      if (typeof req.session.session_ID == 'undefined') {
        assignSessionID(req, function(err, result) {;
          if (err) {
            console.log("error inserting sessionID");
          }
        });
      }
      res.sendFile(path.join(__dirname,'index2.html'));
  }); 





  app.get('/joinqueue', function(req, res) {
    //validate with cookies 
    console.log(req.query);
    req.session.socket_ID = req.query.socket_ID;
    if (typeof req.session.session_ID == 'undefined') {
      //irregular entrance
      if (IRREGULAR_ENTRY) {
        assignSessionID(req, function(err, result) {
          if (err) {
            console.log("error inserting sessionID")
          } else {
            console.log(result);
          }
        });
      } else {
        res.send(null);
        return;
      }
    }
    db.get().collection('sessions').findOne({"session_ID": req.session.session_ID}, function(err, document) {
      if (document == null) {
        console.log("Invalid Session!");
      } else {
        //update the socketID in database
        //update session to be in queue
        db.get().collection('sessions').update(document, {$set: {"inQueue":true, "socket_ID": req.session.socket_ID}});

        //find room with 1 of genre
        db.get().collection('rooms').findOne({"genre": req.query.genre, "size": 1}, function(err, room) {
          console.log("room");
          console.log(room);
          if (room == null) {
            //not found
            // create room with genre
            db.get().collection('rooms').save({
              "genre": req.query.genre,
              "size": 1,
              "users":[{"session_ID":req.session.session_ID, "socket_ID":req.session.socket_ID}]
            }, {w : 1},  function(err, result) {
              if (err) {
                res.send({"success": false});
                return;
              }
              res.send({"success": true});
            });
          } else {
            //join the room
            console.log("match found")
            var newUsersArr = room.users.concat([{"session_ID":req.session.session_ID, "socket_ID":req.session.socket_ID}]);
            db.get().collection('rooms').update(

              room, {$set: {"users": newUsersArr,"size": 2}},
              function(err, data) {
                if (err) {
                res.send({"success": false});
                } else { 
                res.send({"success": true});
              }
                newUsersArr.forEach(function(element) {
                  var socketid = element.socket_ID;
                  io.to(socketid).emit('match found', {"room_ID":room._id});
                });

              });

          }
        })
        
      }
    });
  });

  function assignSessionID(req, callback) {
  
    req.session.session_ID = randomstring.generate(10);
    // add to database
    db.get().collection('sessions').insertOne({
      "session_ID": req.session.session_ID,
      "socket_ID": null
    }, function(err, result) {
      callback(err, result);
    }); 
  }
  io.on('connection', function (socket) {
    console.log("Client joined on socket: " + socket.id);
  });


app.get('/room', function(req, res) {
  var room_ID = req.query.room_ID;
  var userInfo = {"session_ID" : req.session.session_ID,
                  "socket_ID" : req.session.socket_ID}
    
  //verify whether cookie matches with registered
  db.get().collection("rooms").findOne({'_id':room_ID}, function(err, room) {
    if (room.users.indexOf(userInfo) != -1) {
      //passed check
      res.send({"success":true});
    } else {
      //not a user in this session
      res.send({"success":false});
    }
  });
 


});
