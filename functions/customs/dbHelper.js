let customHelper = require('./customHelpers');

const notificationsCollection = 'notifications';

const presenceCollection =  'presence';

var uploadFileOnRemoteServer = function(file , vars){
var error = '';
return new Promise (
function (resolve , reject)
{
var uploadTask = vars.storage.child('wordPlayList/' + file.name).put(file);

// Listen for state changes, errors, and completion of the upload.
uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
function(snapshot) {
// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
console.log('Upload is ' + progress + '% done');
switch (snapshot.state) {
    case firebase.storage.TaskState.PAUSED: // or 'paused'
    console.log('Upload is paused');
    break;
    case firebase.storage.TaskState.RUNNING: // or 'running'
    console.log('Upload is running');
    break;
}
}, function(error) {

// A full list of error codes is available at
// https://firebase.google.com/docs/storage/web/handle-errors
switch (error.code) {
    case 'storage/unauthorized':
    error = vars.errMsg.UnauthorizedUser;
    break;
    
    case 'storage/canceled':
    // User canceled the upload
    error = vars.errMsg.UploadCancelled;
    break;
    
    case 'storage/unknown':
    // Unknown error occurred, inspect error.serverResponse
    error = vars.errorMsgs.ServerError;
    break;
}
}, function() {
// Upload completed successfully, now we can get the download URL
uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
    success = downloadURL;
});
});

if(error != '')
{
reject(error);
}else{
resolve(success);
}
}
);

}

var addToDb = function (collection , uniqueID , data , vars)
{
return new Promise ( function(resolve , reject){

data.guid = uniqueID;
data.created_at = new Date().getTime();
data.deleted_at = null;

vars.db.collection(collection).doc(uniqueID).set(data).then((response) => {
resolve(response);
}).catch((err) => {
console.log(err);
reject(vars.errorMsgs.adderror);
});

});
}

var getData = function(offset , limit , collection , findFrom ,specificColumn , orderBy , vars)
{
var query = vars.db.collection(collection);
if(specificColumn && findFrom)
{
query = query.where(findFrom,'==',specificColumn);
}else if(offset && limit){
query = query.startAfter(offset)
.limit(limit);
}else if(orderBy)
{
query = query.orderBy(orderBy);
}else{
query = query.orderBy('created_at');
}

return query.where('deleted_at','==',null).get();
}


var deleteFromDb = function(collectionName , refID , vars)
{
return vars.db.collection(collectionName)
.doc(refID)
.update('deleted_at' , new Date().getTime());

}

var fullUpdate = function(collectionName , refID , params , vars)

{
return vars.db.collection(collectionName).doc(refID).set(params);
}

var chunkUpdate = function(collectionName , refID , request ,vars)
{
return vars.db.collection(collectionName).doc(refID).update(request);
}


var alreadyExist = function(collection , column , dataToCheck , vars)
{
return vars.db.collection(collection).where(column,'==',dataToCheck).get();
}


var addToRealTimeDb = function (collection , parentID ,uniqueID , data  ,vars)
{
    return new Promise ( function(resolve , reject){

    data.guid = uniqueID;
    data.created_at = new Date().getTime();
    data.deleted_at = null;
    let ref = vars.rtdb.ref(collection +'/'+parentID+'/' + uniqueID);
    var dataToSave = ref.set(data);

        resolve(dataToSave);

    });

}

var getFromRealtimeDb = function (collection , refID , vars)
{

    return new Promise(function(resolve , reject){
        
        vars.rtdb.ref('/'+collection+'/'+refID+'/').once('value')
        .then(function(snapshot) {
            resolve(snapshot.val());
        })
        .catch(function(err){
            reject(err);
        });

    });

}

var removeFromRealtimeDb = function(path , vars)
{
return vars.rtdb.ref(path).remove();
}

var getQuestions = function(categoryID , vars)
{
return new Promise(function(resolve , reject){

queryRef = vars.db.collection('questions')
.where("category","==", categoryID)
.get();

queryRef.then(function(snapshot)
{


let dataRecieved =  snapshot.docs.map(function (documentSnapshot) {
    return documentSnapshot.data();
});

let questions = [];

if(dataRecieved.length <= vars.questionPerRound)
{
    resolve(dataRecieved);                    
}

for(let i = 0; i < 10 ; i++)
{
    questions.push(dataRecieved[Math.floor(Math.random()*dataRecieved.length)]); 
    
    
    if(i === (vars.questionPerRound - 1))
    {
        resolve(questions);  
    }
}


}).catch(function(err)
{
reject(err);
});

});

}

var followCategoryByUser = function(userID , collection , vars)
{
return new Promise(function(resolve , reject){

let categoriesFollowed = getData(false,false,collection,'userID',userID,false,vars);

categoriesFollowed.then(function(snapshot)
{
let dataRecieved =  snapshot.docs.map(function (documentSnapshot) {
    return documentSnapshot.data();
});


let incr = 1;

for(let i = 0 ; i < dataRecieved.length ; i++)
{
    
    var categoryFollowed = [];
    
    categoryDetails = getData(false,false,'categories','guid',dataRecieved[i].categoryID,false,vars);
    
    categoryDetails.then(function(snapshot)
    {
        
        let categoryData = snapshot.docs.map(function (documentSnapshot) {
            let res = documentSnapshot.data();
            
            res.following_guid = dataRecieved[i].guid;
            
            return res;
        });
        
        
        
        Promise.all([
            categoryFollowers(categoryData[0].guid , vars) ,                         isFollowingCategory(categoryData[0].guid , userID , vars) ,              getFollowingGUID(categoryData[0].guid , userID , vars) , 
            getCategoryChildren(categoryData[0].guid , vars)
        ])
        .then(function(arr){
            
            categoryData[0].followers = arr[0];
            categoryData[0].is_following = arr[1];
            categoryData[0].children = arr[3];    
            
            categoryFollowed.push(categoryData[0]);
            
            if(dataRecieved.length === incr)
            {
                resolve(categoryFollowed);
                
            }
            incr++;
            
        }).catch(function(err){
            reject(err)
        });
        
    });
    
}
}).catch(function(err)
{
reject(err);
});
});
}

var getAllCategories = function(userID , vars)
{
return new Promise(function(resolve , reject){

let user_id ;

if(userID)
{
user_id = userID;
}
else
{
user_id = 0;
}

let getAllCategories = getData(false,false,'categories',false,false,false,vars);

getAllCategories.then(function(snapshot)
{
let res = [];
let incr = 1;
snapshot.docs.map(function (documentSnapshot) {
    
    let response =  documentSnapshot.data();
    
    Promise.all([
        categoryFollowers(response.guid , vars) ,                         isFollowingCategory(response.guid , user_id , vars) , 
        getCategoryChildren(response.guid , vars)
    ])
    .then(function(arr){
        response.followers = arr[0];
        response.is_following = arr[1];
        response.children = arr[2];
        
        if( (!response.is_featured && !response.parent_category) || (response.parent_category == 0 && response.parent_category == 0) )
        {
            res.push(response);
        }
        
        if(incr=== snapshot.size)
        {
            resolve(res);
        }
        incr++;
    });
});

}).catch(function(err){
reject(err);
});

});
}


var categoryDetails = function(categoryID , userID , vars)
{
return new Promise(function(resolve , reject){

let getAllCategories = getData(false,false,'categories','guid',categoryID,false,vars);

getAllCategories.then(function(snapshot)
{
let res = [];
snapshot.docs.map(function (documentSnapshot) {
    
    let response =  documentSnapshot.data();
    
    Promise.all([
        categoryFollowers(response.guid , vars) ,                         isFollowingCategory(response.guid , userID , vars) ,
        getFollowingGUID(response.guid , userID , vars), 
        getCategoryChildren(response.guid , vars)
    ])
    .then(function(arr){
        response.followers = arr[0];
        response.is_following = arr[1];
        response.following_guid = arr[2];
        response.children = arr[3];
        
        res.push(response);
        
        if(res.length === snapshot.size)
        {
            resolve(res[0]);
        }
    });
});

}).catch(function(err){
console.log(err);
reject(err);
});

});
}



var categoryFollowers = function(categoryId , vars)
{

return new Promise(function(resolve , reject){

let getAllCategories = getData(false,false,'followCategory','categoryID' ,categoryId,false,vars);
getAllCategories.then(function(snapshot){

resolve(snapshot.size);
})
.catch(function(err){
reject(err);
});

});

}

var isFollowingCategory = function(categoryID , userID , vars)
{
return new Promise(function(resolve , reject){

let getAllCategories = getData(false,false,'followCategory','categoryID' ,categoryID,false,vars);

getAllCategories.then(function(snapshot){

let isFollowing = 0;

snapshot.docs.map(function(documentSnapshot){
    if(documentSnapshot.data().userID === userID)
    {
        isFollowing = 1;
    }
});

resolve(isFollowing);
})
.catch(function(err){
reject(err);
});

});

}

var getFollowingGUID = function(categoryID , userID , vars)
{
return new Promise(function(resolve , reject){

let getAllCategories = getData(false,false,'followCategory','categoryID' ,categoryID,false,vars);

getAllCategories.then(function(snapshot){

let followingGUID = 0;

snapshot.docs.map(function(documentSnapshot){
    if(documentSnapshot.data().userID === userID)
    {
        followingGUID = documentSnapshot.data().guid;
    }
});

resolve(followingGUID);
})
.catch(function(err){
reject(err);
});

});

};

var getCategoryChildren = function(categoryID , vars)
{
return new Promise(function(resolve , reject){

let getAllCategories = getData(false,false,'categories','parent_category',categoryID,false,vars);

getAllCategories.then(function(snapshot){

let dataRecieved = snapshot.docs.map(function(documentSnapshot){
    return documentSnapshot.data();
});

resolve(dataRecieved);
})
.catch(function(err){
reject(err);
});
});
}

var submitSinglePlayerResult = function(request , vars)
{

return new Promise(function(resolve , reject){

let user = getData(false , false , 'users' , 'guid' , request.userID , false , vars);

user.then(function(userData){

let dataRecieved = userData.docs.map(function(documentSnapshot){
    return documentSnapshot.data();
});

let categoryID = request.categoryID;

dataRecieved = dataRecieved[0];


if(request.correctAnswer && request.correctAnswer == 1)
{
    dataRecieved.current_exp = dataRecieved.current_exp ? parseInt(dataRecieved.current_exp) + 1 : 1;
}

if(request.allCorrectAnswer && request.allCorrectAnswer == 1)
{
    dataRecieved.current_exp = dataRecieved.current_exp ? parseInt(dataRecieved.current_exp) + 10 : 10;
}

if(request.win && request.win == 1)
{
    dataRecieved.games_won = dataRecieved.games_won ? parseInt(dataRecieved.games_won) + 1 : 1;
    
    let alreadyWonCategories = dataRecieved.won_categories ? dataRecieved.won_categories : {} ;
    
    alreadyWonCategories[generateUUID()] = 
    {
        'title' : request.categoryTitle,
        'categoryId' : categoryID,
        
    };
    
    let dataForLeaderBoard = {
        'category' : categoryID,
        'user' : dataRecieved
    };
    addToDb('leaderboard',generateUUID(),dataForLeaderBoard,vars);
    dataRecieved.won_categories = alreadyWonCategories;
}

if(request.draw && request.draw == 1)
{
    dataRecieved.games_draw = dataRecieved.games_draw ? parseInt(dataRecieved.games_draw) + 1 : 1;
    
}

if(request.losed && request.losed == 1)
{
    dataRecieved.games_losed = dataRecieved.games_losed ? parseInt(dataRecieved.games_losed) + 1 : 1;
}

if(request.win == 1 || request.losed == 1 || request.draw == 1)
{
    
    let alreadyPlayedCategories = dataRecieved.played_categories ? dataRecieved.played_categories : {} ;
    
    alreadyPlayedCategories[generateUUID()] = {
        'title' : request.categoryTitle,
        'categoryId' : categoryID
    };
    
    dataRecieved.played_categories = alreadyPlayedCategories;
    
    dataRecieved.games_played = dataRecieved.games_played ? parseInt(dataRecieved.games_played) + 1 : 1;
    
    
    if(parseInt(dataRecieved.current_exp) % 30 == 0)
    {
        dataRecieved.total_points = dataRecieved.total_points ? parseInt(dataRecieved.total_points) + 10 : 10;
    }
    
    if(parseInt(dataRecieved.games_played) % 3 == 0)
    {
        dataRecieved.total_points = dataRecieved.total_points ? parseInt(dataRecieved.total_points) + 10 : 10;
    }
}

addToDb('users',request.userID,dataRecieved,vars);
resolve(dataRecieved);
})
.catch(function(err){
console.log(err);
reject(err);
});

});
}

var leaderboard = function(categoryID , vars)
{
return new Promise(function(resolve , reject){

let users = getData(false , false , 'leaderboard' , 'category', categoryID , false , vars);

users.then(function(userData){

if(!userData.size)
{
    resolve([]);
}

let results = {};
let dataRecieved = userData.docs.map(function(documentSnapshot){
    let userData =  documentSnapshot.data().user;
    
    userData.category_wins = results[userData.guid] ? parseInt(userData.category_wins) + 1 : 1;
    
    results[userData.guid] = userData;
    
    return results;
});

let finalResult = [];
let incr = 1;

for(let key in dataRecieved[0])
{
    finalResult.push(dataRecieved[0][key]);
    if(incr === dataRecieved.length)
    {
        resolve(finalResult.sort(function(a, b) {
            return a.category_wins > b.category_wins;
        }));
    }
    incr++;
}
})
.catch(function(err){
reject(err);
});

});
}

var checkUserFollowing = function(followerID , followingUserID , vars)
{
return new Promise(function(resolve , reject){

let queryData = vars.db.collection('followUser')
.where('following_user_id','==',followingUserID)
.where('follower_user_id','==',followerID)
.get();

queryData.then(function(snapshot){
resolve(snapshot.size);
}).catch(function(err){
reject(err);
});
});

}

var search = function(keyword , user_id , vars)
{
return new Promise(function(resolve , reject){

let users = getData(false , false , 'users' , false, false , false , vars);
let categories = getData(false , false , 'categories' , false, false , false , vars); 
let searchResults = [];

searchResults['users'] = [];
searchResults['categories'] = [];

Promise.all([users , categories])
.then(function(response){

let incr1 = 1;

response[0].docs.map(function(documentSnapshot){
    let userSnapShot =  documentSnapshot.data();
    
    let username = userSnapShot['first_name'] ? userSnapShot['first_name'] : '';
    
    if(username.toLowerCase().indexOf(keyword.toLowerCase().trim()) !== -1 && userSnapShot['guid'] != user_id)
    {
        searchResults['users'].push(userSnapShot);
    }
    
    if(incr1 === response[0].size)
    {
        let incr2 = 1;
        
        response[1].docs.map(function(documentSnapshot){
            
            let categoriesSnapShot = documentSnapshot.data();
            
            if(categoriesSnapShot['title'].toLowerCase().indexOf(keyword.toLowerCase().trim()) !== -1 && !categoriesSnapShot['is_featured'])
            {
                searchResults['categories'].push(categoriesSnapShot);
                
            }
            
            if(incr2 === response[1].size)
            {
                if(searchResults['users'].length == 0)
                {
                    resolve(searchResults);
                }
                
                let incr3 = 1;
                for(let key in searchResults['users'])
                {
                    checkUserFollowing(user_id , searchResults['users'][key].guid , vars)
                    .then(function(is_following){
                        
                        searchResults['users'][key].is_following = is_following;
                        
                        if(incr3 == searchResults['users'].length)
                        {
                            resolve(searchResults);
                        }
                        incr3++;
                    });
                }
            }
            
            incr2++;
        });
    }
    incr1++;
});
})
.catch(function(err){
reject(err);
});
});
}

var generateUUID = function () {
var d = new Date().getTime();
if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
d += performance.now(); //use high-precision timer if available
}
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
var r = (d + Math.random() * 16) % 16 | 0;
d = Math.floor(d / 16);
return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});
}

var removeFollowUser = function(request , vars)
{
return new Promise(function(resolve , reject){

let getDoc = vars.db.collection('followUser')
.where('following_user_id','==',request.following_user_id)
.where('follower_user_id','==',request.follower_user_id)
.get();

getDoc.then(function(querySnapshot) {

querySnapshot.forEach(function(doc) {
    
    let rtdbPath = notificationsCollection+'/'+request.following_user_id+'/listing/'+doc.data().guid;
    
    removeFromRealtimeDb(rtdbPath , vars);
    decreaseNotificationCount(request.following_user_id , vars);
    doc.ref.delete();
    
});

//change follower and following count
let senderData = alreadyExist('users','guid',request.follower_user_id,vars);
let recieverData = alreadyExist('users','guid',request.following_user_id,vars);

Promise.all([senderData , recieverData])
.then(function(response){
    
    senderData = response[0].docs.map(function(querySnapshot){
        return querySnapshot.data();
    });
    
    recieverData = response[1].docs.map(function(querySnapshot){
        return querySnapshot.data();
    });
    
    let senderDataToUpdate = {'following_count' : senderData[0].following_count ? parseInt(senderData[0].following_count) - 1 : 0};
    
    chunkUpdate('users', request.follower_user_id , senderDataToUpdate ,vars);
    console.log();
    let recieverDataToUpdate = {'follower_count' : recieverData[0].follower_count ? parseInt(recieverData[0].follower_count) - 1 : 0};
    
    chunkUpdate('users', request.following_user_id , recieverDataToUpdate ,vars);
    
})
.catch(function(err){
    console.log('err',err);
});

resolve();
});
});
}

var increaseNotificationCount = function(userId , vars)
{
getFromRealtimeDb(notificationsCollection,userId+'/notification_count',vars)
.then(function(response){

let count = 1;
if(response)
{
count = parseInt(response) + count;
}
addToRealTimeDb(notificationsCollection,userId,'notification_count',count,vars);

}).catch(function(err){
console.log('err',err);
});
}

var decreaseNotificationCount = function(userId , vars)
{
getFromRealtimeDb(notificationsCollection,userId+'/notification_count',vars)
.then(function(response){

let count = 1;
if(response)
{
count = parseInt(response) - count;
}
addToRealTimeDb(notificationsCollection,userId,'notification_count',count,vars);

}).catch(function(err){
console.log('err',err);
});
}


var sendNotification = function(notificationData , vars)
{
return new Promise(function(resolve , reject){
// Send a message to the device corresponding to the provided
// registration token.
vars.firebase.messaging().send(notificationData)
.then((response) => {
// Response is a message ID string.
resolve(response);
})
.catch((error) => {
reject(error);
});
});
}

var pushNotifyUser = function(type , sender , reciever , firestoreGUID , vars)
{
switch(type)
{
case 'followUser':

console.log(reciever);   
let senderData = alreadyExist('users','guid',sender,vars);

let recieverData = alreadyExist('users','guid',reciever,vars);

Promise.all([senderData , recieverData])
.then(function(response){

senderData = response[0].docs.map(function(querySnapshot){
    return querySnapshot.data();
});

recieverData = response[1].docs.map(function(querySnapshot){
    return querySnapshot.data();
});

let replacers = [
    senderData[0].first_name
];

let notifcationData = vars.notifications[type];

let customData = {
    'senderID' : senderData[0].guid,
    'recieverID' : recieverData[0].guid,
    'notification_type' : type,
    'senderImage' : senderData[0].image_url
};

let sendNotificationData = customHelper.makeNotificationData(
    notifcationData,
    customData,
    replacers,
    recieverData[0].device_token
    );
    
    let staticNotificationData  = JSON.stringify(sendNotificationData);
    
    let userID = recieverData[0].guid;
    
    addToRealTimeDb(
        notificationsCollection,
        userID+'/listing',
        firestoreGUID,
        sendNotificationData,
        vars
        )
        .then(function(){
            
            increaseNotificationCount(userID  , vars);
            
            let senderDataToUpdate = {'following_count' : senderData[0].following_count ? parseInt(senderData[0].following_count) + 1 : 1};
            
            chunkUpdate('users', sender , senderDataToUpdate ,vars);
            
            let recieverDataToUpdate = {'follower_count' : recieverData[0].follower_count ? parseInt(recieverData[0].follower_count) + 1 : 1};
            
            chunkUpdate('users', reciever , recieverDataToUpdate ,vars);
            
            let notification_status = recieverData[0].notification_status ? recieverData[0].notification_status : 1; 
            console.log('noti',notification_status);
            if(notification_status)
            {
                
                sendNotification(JSON.parse(staticNotificationData) , vars)
                .then(function(res){
                    console.log('res',res);
                }).catch(function(err){
                    console.log('err',err);
                });
            }
            
        }).catch(function(err){
            console.log('err',err);
        });
        
        
    })
    .catch(function(err){
        console.log('err',err);
    });
    
    break;
}
}

var addToQueue = function(userID , categoryID , vars)
{
return new Promise(function(resolve , reject){
    
    let userObj = getData(false , false , 'users' , 'guid' , userID , false , vars);
    
    userObj.then(function(response){
        
        userData = response.docs.map(function(querySnapshot){
            return querySnapshot.data();
        });
        
        
        checkAnyPlayerAvailable(userID , categoryID , vars)
        .then(function(result){
            
            createNewRoom(userData[0] , result , categoryID , vars);
            
            let removeQueuePlayerPath = 'gameProgress/waiting/'+categoryID+'/'+result.guid;
            
            removeFromRealtimeDb(removeQueuePlayerPath , vars);
            
        })
        .catch(function(){
            
            var presenceRef  = vars.rtdb.ref(presenceCollection+'/'+userID);
            
            presenceRef.on('value', (snapshot) => {
                
                if(snapshot.val() && snapshot.val().status == 'offline')
                {
                    console.log('val',snapshot.val());
                    let removeQueuePlayerPath = 'gameProgress/waiting/'+categoryID+'/'+userID;
                    
                    console.log('removeQueuePlayerPath',removeQueuePlayerPath);
                    removeFromRealtimeDb(removeQueuePlayerPath , vars);
                }
                
            });
            
            addToRealTimeDb('gameProgress' , 'waiting/'+categoryID , userID , userData[0] , vars);
        });
        
        resolve(userData[0]);
    }).catch(function(err){
        reject(err);
    });
    
});
}

var checkAnyPlayerAvailable = function(requestingUserID , categoryIDSelected , vars)
{
return new Promise(function(resolve , reject){
    var queueRef = vars.rtdb.ref("gameProgress/waiting/"+categoryIDSelected);
    
    let incr = 1;
    
    queueRef.orderByKey().on("value", function(snapshot) {
        
        if(snapshot.numChildren() === 0)
        {
            reject();
        }
        
        snapshot.forEach(function(data) {
            
            if(data.key != requestingUserID)
            {
                resolve(data.val());
            }
            
            if(snapshot.numChildren() === incr)
            {
                reject();
            }
            
            incr++;
        });
        
    });
});
}

var createNewRoom = function(player1Obj , player2Obj , categoryID , vars){

let newRoomID = customHelper.generateUUID();


let playingInfo = {'room' : newRoomID , 'category' : categoryID}; 

addToRealTimeDb('gameProgress' , 'playing' , player1Obj.guid , playingInfo , vars);

addToRealTimeDb('gameProgress' , 'playing' , player2Obj.guid , playingInfo , vars);


getQuestions(categoryID , vars)
.then(function(questions){
    
    let category = getData(false , false , 'categories' , 'guid' , categoryID , false , vars);
   

    let presenceRef1  = vars.rtdb.ref(presenceCollection+'/'+player1Obj.guid);
    let presenceRef2  = vars.rtdb.ref(presenceCollection+'/'+player2Obj.guid);

    // let userResultsRef1 = vars.rtdb.ref('userResults/'+newRoomID+'/'+player1Obj.guid);        
    // let userResultsRef2 = vars.rtdb.ref('userResults/'+newRoomID+'/'+player2Obj.guid);          
    
    presenceRef1.on('value', (snapshot) => {
        
        if(snapshot.val() && snapshot.val().status == 'offline')
        {
            endRoom(categoryID , newRoomID , vars);
        }
        
    });

    presenceRef2.on('value', (snapshot) => {
        
        if(snapshot.val() && snapshot.val().status == 'offline')
        {
            endRoom(categoryID , newRoomID , vars);
        }
        
    });

    // userResultsRef1.on('value' , (snapshot) => {
    //     console.log('player1 call');
    //     let value = snapshot.val();
    //     if(value)
    //     {

    //         submitMultiplayerPlayerResult(value.playerID , value.categoryID , value.roomID , value.rightAnswer , vars)
    //         .then(function(data){
    //             console.log('Player1 data submitted' , data);
    //             return data;
    //         }).catch(function(err){
    //             console.log('Player1 err' , err);
    //         });
            
    //     }
    // });

    // userResultsRef2.on('value' , (snapshot) => {
    //     console.log('player2 call');
    //     let value = snapshot.val();
    //     if(value)
    //     {
    //       submitMultiplayerPlayerResult(value.playerID , value.categoryID , value.roomID , value.rightAnswer , vars)
    //       .then(function(data){
    //           console.log('Player2 data submitted' , data);
    //           return data;
    //       }).catch(function(err){
    //           console.log('Player2 err' , err);
    //       });
            
    //     }
    // });
    
    category.then(function(snapshot){
        
        recieverData = snapshot.docs.map(function(querySnapshot){
            return querySnapshot.data();
        });
        
        let roomData = {
            'category' : categoryID,
            'player1' : player1Obj,
            'player2' : player2Obj,
            'questions' : questions,
            'roomState' : 'active',
            'categoryTitle' : recieverData[0].title,
            'categoryImage' : recieverData[0].image_uri
        };

        roomData[roomData.player1.guid] = {
            'currentPoints' : 0 ,
            'currentRound' : 0
        };

        roomData[roomData.player2.guid] = {
            'currentPoints' : 0 ,
            'currentRound' : 0
        };
        
        roomData['winner'] = {};

        roomData['draw'] = 0;
        
        //addToRealTimeDb('rooms' , categoryID , newRoomID , roomData , vars);
        let ref = vars.rtdb.ref('rooms' +'/'+categoryID+'/' + newRoomID);
                  ref.set(roomData);
    });
    
});

}

var removeFromQueue = function(userID , categoryID , vars)
{
return new Promise(function(resolve , reject){
    let removeQueuePlayerPath = 'gameProgress/waiting/'+categoryID+'/'+userID;
    
    removeFromRealtimeDb(removeQueuePlayerPath , vars);
    
    resolve();
});
}

var submitMultiplayerPlayerResult = function(playerID , categoryID , roomID , rightAnswer , vars)
{
return new Promise(function(resolve , reject){
    
    getFromRealtimeDb('rooms' , categoryID+'/'+roomID+'/' , vars)
    .then(function(response){

                
                let currentRound = parseInt(response[playerID].currentRound) + 1;
                let currentPoints = parseInt(response[playerID].currentPoints) + parseInt(rightAnswer);
                
                response[playerID] = {'currentRound' : currentRound , 'currentPoints' : currentPoints};
                
                let questionsAsked = response.totalQuestionsAsked ? parseInt(response.totalQuestionsAsked) + 1 : 1;
                
                response.totalQuestionsAsked = questionsAsked;
                
                if(questionsAsked == (Object.keys(response.questions).length * 2))
                {
                    endRoom(categoryID , roomID , vars);
                    response.roomState = 'ended';
                }

                let ref = vars.rtdb.ref('rooms' +'/'+categoryID+'/' + roomID);

                submitSinglePlayerResult({
                'userID' : playerID,
                'correctAnswer' : rightAnswer,
                'categoryTitle' : response.categoryTitle,
                'categoryID' : categoryID
                } , vars);


                resolve(ref.set(response));

                  

        }).catch(function(err){
        console.log('submitMultiplayerPlayerResult err' , err);
    });
    
    });
}


var endRoom = function(categoryID , roomID , vars)
{
    return new Promise(function(resolve , reject){

        getFromRealtimeDb('rooms' , categoryID+'/'+roomID+'/' , vars)
        .then(function(response){
            
            let player1 = response[response['player1'].guid];
            let player2 = response[response['player2'].guid];
            
            let player1DataSubmitted , player2DataSubmitted ;
            
            if(player1.currentPoints > player2.currentPoints)
            {
                response.winner = response['player1'];
    
                player1DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player1'].guid,
                        'win' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
                
                player2DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player2'].guid,
                        'losed' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
            }
            else if(player2.currentPoints == player1.currentPoints)
            {
                response.draw = 1;
                player1DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player1'].guid,
                        'draw' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
                
                player2DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player2'].guid,
                        'draw' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
            }else{
                response.winner = response['player2'];
    
                    player1DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player1'].guid,
                        'losed' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
                
                player2DataSubmitted = submitSinglePlayerResult(
                    {
                        'userID' : response['player2'].guid,
                        'win' : 1,
                        'categoryTitle' : response.categoryTitle,
                        'categoryID' : categoryID
                    } , 
                    vars
                    );
            }
    
            // if(player1.currentPoints == Object.keys(response.questions).length)
            // {
            //     player1DataSubmittedForAllCorrectAnswers = submitSinglePlayerResult(
            //         {
            //             'userID' : response['player1'].guid,
            //             'allCorrectAnswer' : 1,
            //             'categoryTitle' : response.categoryTitle,
            //             'categoryID' : categoryID
            //         } , 
            //         vars
            //         );
            // }
            
            // if(player2.currentPoints == Object.keys(response.questions).length)
            // {
            //     player2DataSubmittedForAllCorrectAnswers = submitSinglePlayerResult(
            //         {
            //             'userID' : response['player2'].guid,
            //             'allCorrectAnswer' : 1,
            //             'categoryTitle' : response.categoryTitle,
            //             'categoryID' : categoryID
            //         } , 
            //         vars
            //         );
            // }
            
            response.roomState = 'ended';
    
            Promise.all([player1DataSubmitted , player2DataSubmitted])
            .then(function(data){
                response['player1'] = data[0];
                response['player2'] = data[1];
    
                addToRealTimeDb('rooms' , categoryID , roomID , response , vars);
            
                addToRealTimeDb('history' , response['player1'].guid , roomID , response , vars);
                
                addToRealTimeDb('history' , response['player2'].guid , roomID , response , vars);
    
                removeFromRealtimeDb('gameProgress/playing/'+response['player1'].guid , vars);
    
                removeFromRealtimeDb('gameProgress/playing/'+response['player2'].guid , vars);
    
                vars.rtdb.ref(presenceCollection+'/'+response['player1'].guid).off();
                
                vars.rtdb.ref(presenceCollection+'/'+response['player1'].guid).off();
                resolve();
            });
            
        });
    });
}

exports.uploadFileOnRemoteServer = uploadFileOnRemoteServer;
exports.getData = getData;
exports.deleteFromDb = deleteFromDb;
exports.fullUpdate = fullUpdate;
exports.chunkUpdate = chunkUpdate;
exports.addToDb = addToDb;
exports.addToRealTimeDb = addToRealTimeDb;
exports.getFromRealtimeDb = getFromRealtimeDb;
exports.alreadyExist = alreadyExist;
exports.getQuestions = getQuestions;
exports.followCategoryByUser = followCategoryByUser;
exports.getAllCategories = getAllCategories;
exports.categoryDetails = categoryDetails;
exports.submitSinglePlayerResult = submitSinglePlayerResult;
exports.leaderboard = leaderboard;
exports.search = search;
exports.removeFollowUser = removeFollowUser;
exports.pushNotifyUser = pushNotifyUser;
exports.addToQueue = addToQueue;
exports.removeFromQueue = removeFromQueue;
exports.submitMultiplayerPlayerResult = submitMultiplayerPlayerResult;
exports.endRoom = endRoom;

