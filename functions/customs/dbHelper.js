
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



                Promise.all([categoryFollowers(categoryData[0].guid , vars) ,                                      isFollowingCategory(categoryData[0].guid , userID , vars) , 
                           getCategoryChildren(categoryData[0].guid , vars)])
                         .then(function(arr){

                            categoryData[0].followers = arr[0];
                            categoryData[0].is_following = arr[1];
                            categoryData[0].children = arr[2];    
                            
                            categoryFollowed.push(categoryData);
                            
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
    
    var getAllCategories = function(vars)
    {
        return new Promise(function(resolve , reject){

            let getAllCategories = getData(false,false,'categories',false,false,false,vars);
            
            getAllCategories.then(function(snapshot)
            {
                let dataRecieved =  snapshot.docs.map(function (documentSnapshot) {
                    return documentSnapshot.data();
                });

                
            }).catch(function(err){
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
    
    