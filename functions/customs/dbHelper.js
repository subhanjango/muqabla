
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
            query = query.orderBy(orderBy)
            .startAfter(offset)
            .limit(limit);
        }else if(orderBy)
        {
            query = query.orderBy(orderBy);
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
            
            if(dataToSave)
            {
                let data = getFromRealtimeDb(collection , parentID , vars);
                if(data)
                {
                    data.ref = vars.rtdb.ref(collection +'/'+parentID+'/');
                    resolve(data);
                }
            }else{
                reject(vars.errorMsgs.adderror);
            }
        });
        
    }
    
    var getFromRealtimeDb = function (collection , refID , vars)
    {
        return vars.rtdb.ref('/'+collection+'/'+refID+'/').once('value').then(function(snapshot) {
            return snapshot.val();
        });
    }
    
    var getQuestions = function(categoryID , vars , random)
    {
        return new Promise(function(resolve , reject){
            
            queryRef = vars.db.collection('questions')
            .where("category","==", categoryID)
            .limit(vars.questionPerRound)
            .get();
            
            queryRef.then(function(snapshot)
            {
                let dataRecieved =  snapshot.docs.map(function (documentSnapshot) {
                    return documentSnapshot.data();
                });
                
                resolve(dataRecieved);
                
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
    
    var search = function(keyword , vars)
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
                  
                    if(username.indexOf(keyword) !== -1)
                    {
                        searchResults['users'].push(userSnapShot);
                    }

                    if(incr1 === response[0].size)
                    {
                        let incr2 = 1;

                       response[1].docs.map(function(documentSnapshot){

                            let categoriesSnapShot = documentSnapshot.data();
        
                            if(categoriesSnapShot['title'].indexOf(keyword) !== -1 && categoriesSnapShot['is_featured'] == 0)
                            {
                                searchResults['categories'].push(categoriesSnapShot);

                            }

                            if(incr2 === response[1].size)
                            {
                               resolve(searchResults);
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
    
    