
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
        }else{
            query = query.orderBy(orderBy)
            .where('deleted_at','==',null)
            .startAfter(offset)
            .limit(limit)
        }
        
        return query.get();
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
    
    
    
    
    
    exports.uploadFileOnRemoteServer = uploadFileOnRemoteServer;
    exports.getData = getData;
    exports.deleteFromDb = deleteFromDb;
    exports.fullUpdate = fullUpdate;
    exports.chunkUpdate = chunkUpdate;
    exports.addToDb = addToDb;
    exports.addToRealTimeDb = addToRealTimeDb;
    exports.getFromRealtimeDb = getFromRealtimeDb;
    exports.alreadyExist = alreadyExist;
    
    