//pre defined variables
//setup -- pre-reqs
const express = require('express'),
app = express(),
functions = require("firebase-functions"),
firebase = require("firebase-admin"),
fileUpload = require('express-fileupload'),

config = {
    apiKey: "AIzaSyDNgEjuMHwiUjGs9iWRxPU5hnMzWl0hbcI",
    authDomain: "muqablapro.firebaseapp.com",
    databaseURL: "https://muqablapro.firebaseio.com/",
    storageBucket: "gs://muqablapro.appspot.com",
    projectId: "muqablapro"
  };
  
  firebase.initializeApp(config);
  

  const db = firebase.firestore()
  //settings = {timestampsInSnapshots: true};
  //db.settings(settings);

    app.use(function(req, res , next){
    res.header("Content-Type" , "application/json");
    next();
    });

app.use(fileUpload());

let presenceRef1  = firebase.database().ref('Oneeb');

presenceRef1.on('value', (snapshot) => {
        
   console.log("sbap" , snapshot.val())

    var time = new Date().getTime();
    var data1 = {};

    data1[time] = {
        "2bd39382-7ee4-492f-96b7-340d1c7cf70c" : {
            "currentPoints" : 0,
            "currentRound" : 0
          }
    }
  
   let ref = firebase.database().ref('Oneeb2');
   ref.set(data1);
    

   let aabbcc  = firebase.database().ref('Oneeb2');
   aabbcc.on('value', (snapshot) => {

    var time = new Date().getTime();
    var data1 = {};

    data1[time] = {
        "2bd39382-7ee4-492f-96b7-340d1c7cf70c" : {
            "currentPoints" : 0,
            "currentRound" : 0
          }
    }
  
   let ref = firebase.database().ref('Oneeb4');
   ref.set(data1);

   });

});



//listener for user registration
exports.userLogger = functions.auth.user().onCreate((user) => {
   console.log("WAITING" , user)
});

exports.api = functions.https.onRequest(app);

