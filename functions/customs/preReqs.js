//setup -- pre-reqs
const express = require('express'),
app = express(),
functions = require("firebase-functions"),
firebase = require("firebase-admin"),
fileUpload = require('express-fileupload'),
multer = require('multer'),
MockExpressRequest = require('mock-express-request'),
cors = require('cors');

successMsg = {
  'dataRetrieved' : 'Retrieval done',
  'added' : 'Document added',
  'updated' : 'Document updated',
  'deleted' : 'Document deleted'
},

errorMsgs = {
  'fileNotFound' : 'No file found to be uploaded',
  'UnauthorizedUser' : 'You are not authorized to perform this task',
  'UploadCancelled': 'Opps ! Upload has been cancelled',
  'ServerError' : 'Unknown error occurred , no response from server',
  'requestedParams' : 'Required params are missing',
  'adderror' : 'Oops! Data was unable to be added , try again',
  'notFound' : 'Sorry ! Nothing was found',
  'noFriends' : 'User has no friends'
},

notifications = {
  'followUser' : {
    'title' : 'You just got followed',
    'body' : '<b>[USER_NAME]</b> is now <b>following</b> you',
    'replacer' : '[USER_NAME]'
  },
  'challengeUser' : {
    'title' : 'You just received a challenge',
    'body' : '<b>[USER_NAME]</b> challenged you',
    'replacer' : '[USER_NAME]'
  }
}


//configurations (firebase)
config = {
  apiKey: "AIzaSyDNgEjuMHwiUjGs9iWRxPU5hnMzWl0hbcI",
  authDomain: "muqablapro.firebaseapp.com",
  databaseURL: "https://muqablapro.firebaseio.com/",
  storageBucket: "gs://muqablapro.appspot.com",
  projectId: "muqablapro"
};

firebase.initializeApp(config);

const db = firebase.firestore(),
storage = firebase.storage();
settings = {timestampsInSnapshots: true};

db.settings(settings);

app.use(function(req, res , next){
  res.header("Content-Type" , "application/json");
  next();
});
//enables cors
app.use(cors());
app.use(fileUpload());

exports.express = express;
exports.app = app;
exports.functions = functions;
exports.firebase = firebase;
exports.MockExpressRequest = MockExpressRequest;
exports.db = db;
exports.storage = storage;
exports.multer = multer;
exports.errorMsgs = errorMsgs;
exports.successMsg = successMsg;
exports.notifications = notifications;
exports.dataColumns = require('./dataColumns');
exports.rtdb = firebase.database();
exports.questionPerRound = 10;