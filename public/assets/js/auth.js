const error_msg_elm = $('#auth_error');
const home_page = 'index.html';
const login_page = 'auth-login.html';

$(function(){
    checkUserSession();
});


function firebaseAuthProcess(email , password) {
    
    firebase_app.auth().signInWithEmailAndPassword(email, password)
    .then(function(data) {
        
        if(data.user.uid) {

            firestore_db.collection("admin").where('uid','==',data.user.uid)
            .get().then((querySnapshot) => {

                let userUID = querySnapshot.docs.map(function(snapshot){
                    return snapshot.data();
                });

                if(userUID.length == 1) {

                makeMySession(data.user.uid);
        
                redirectTo(home_page);
                
                } else {
                    reportErrorToClient('Only a admin can sign in');
                }
            });
        }else {
            reportErrorToClient('Invalid user');
        }
    })
    .catch(function(error) {
        
        if(error.message) {       
            reportErrorToClient(error.message);        
        }
        
    });
    
}

$('#submit_form').on('click' , function(){
    
    let email_address = $('#email_address').val();
    let password = $('#password').val();
    hideErrorElm();
    
    if(!email_address || !password) {
        
        let errorMessage = 'Email and password fields are required';
        
        reportErrorToClient(errorMessage);
    } else {
        firebaseAuthProcess(email_address , password);
    }
    
});


var reportErrorToClient = (msg) => {
    error_msg_elm.removeClass('fade');        
    error_msg_elm.addClass('show');        
    error_msg_elm.html(msg);  
}

var hideErrorElm = () => {
    error_msg_elm.html('');
    error_msg_elm.addClass('fade');  
    error_msg_elm.removeClass('show'); 
}

function checkUserSession() {
    
    if(readCookie('fbase_user') && window.location.pathname == '/auth-login.html') {
        redirectTo(home_page);
    }
    
    if(!readCookie('fbase_user') && window.location.pathname != '/auth-login.html') {
        redirectTo(login_page);
    }
    
}

var redirectTo = (reffered) => {
    window.location.href = reffered;
}

function makeMySession(userID) {
    createCookie('fbase_user' , userID , 365);
}

function createCookie(name, value, days) {
    var expires;
    
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
        c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function logMeOut() {
    eraseCookie('fbase_user');
    checkUserSession();
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
