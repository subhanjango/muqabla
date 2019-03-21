// Initialize Firebase
var config = {
    apiKey: "AIzaSyDNgEjuMHwiUjGs9iWRxPU5hnMzWl0hbcI",
    authDomain: "muqablapro.firebaseapp.com",
    databaseURL: "https://muqablapro.firebaseio.com",
    projectId: "muqablapro",
    storageBucket: "muqablapro.appspot.com",
    messagingSenderId: "1070641798040"
};
const firebase_app = firebase.initializeApp(config);
const firestore_db = firebase.firestore();
const firebase_api_url = "https://us-central1-muqablapro.cloudfunctions.net/api";
//const firebase_api_url = "http://localhost:5001/muqablapro/us-central1/api";


