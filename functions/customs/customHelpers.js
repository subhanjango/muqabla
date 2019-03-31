/* 
Function to create error msgs for client
*/
exports.sendErrorResponse  = function(errMsg , res)
{
    res.status(400).send({'error' : errMsg});
}

/* 
Function to create success msgs for client
*/
exports.sendSuccessResponse = function(happyMsg , res)
{
    res.status(200).send(happyMsg);
}
/* 
Function to validate post request to check required params
*/
exports.validatePostRequest = function(validationParams , request)
{
    return new Promise (function(resolve , reject) {
        
        if(validationParams)
        {
            for (i = 0; i < validationParams.length; i++) {
                
                if(validationParams[i].required)
                {
                    if(!request.body[validationParams[i].param])
                    {
                        let error = {validationParams , 'param_missing' : validationParams[i].param};
                        reject(error);
                    }
                }
                
                
                if((validationParams.length - 1) === i)
                {
                    resolve();
                }
            }
        }else{
            resolve();
        }
        
    });
    
}
/* 
Function to validate get request to check required params
*/
exports.validateGetRequest = function(validationParams , request)
{
    return new Promise (function(resolve , reject) {
        if(validationParams)
        {
            for (i = 0; i < validationParams.length; i++) {
                
                if(validationParams[i].required)
                {
                    if(!request.query[validationParams[i].param])
                    {
                        let error = {validationParams , 'param_missing' : validationParams[i].param};
                        reject(error);
                    }
                }
                
                if((validationParams.length - 1) === i)
                {
                    resolve();
                }
            }
        }else{
            resolve();
        }
        
    });
    
}
/* 
Function to generate unique id on the basis of time 
*/
exports.generateUUID = function () {
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
/* 
Function to generate human readable code
*/
exports.generateReadableCode = function ()
{
    return Math.floor(100000 + Math.random() * 900000);
}
/* 
Function to create readable msg for the client
*/
exports.createMsgForClient  = function(msg , data)
{
    return  {'success' : true , 'msg' : msg , 'data' : data};
}
/* 
Function to replace all undefined values with null from JSON
*/
exports.removeUndefinedFromJSON = function(obj)
{
    return JSON.parse(JSON.stringify(obj, function(k, v) {
        if (v === undefined) { return null; } return v; 
    }));
}

exports.uploadFiles = function(req , res , cb)
{
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    
    const Busboy = require('busboy');
    
    const busboy = new Busboy({ headers: req.headers });
    const tmpdir = os.tmpdir();
    var files = [];
    // This object will accumulate all the fields, keyed by their name
    const fields = {};
    
    // This object will accumulate all the uploaded files, keyed by their name.
    const uploads = {};
    
    // This code will process each non-file field in the form.
    busboy.on('field', (fieldname, val) => {
        // TODO(developer): Process submitted field values here
        console.log(`Processed field ${fieldname}: ${val}.`);
        fields[fieldname] = val;
    });
    
    let fileWrites = [];
    
    // This code will process each file uploaded.
    busboy.on('file', (fieldname, file, filename) => {
        // Note: os.tmpdir() points to an in-memory file system on GCF
        // Thus, any files in it must fit in the instance's memory.
        console.log(`Processed file ${filename}`);
        const filepath = path.join(tmpdir, filename);
        uploads[fieldname] = filepath;
        
        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);
        
        // File was processed by Busboy; wait for it to be written to disk.
        const promise = new Promise((resolve, reject) => {
            file.on('end', () => {
                writeStream.end();
            });
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
        fileWrites.push(promise);
    });
    
    // Triggered once all uploaded files are processed by Busboy.
    // We still need to wait for the disk writes (saves) to complete.
    busboy.on('finish', () => {
        Promise.all(fileWrites)
        .then(() => {
            // TODO(developer): Process saved files here
            for (const name in uploads) {
                files.push(uploads[name]);
            }
            cb(files);
        });
    });
    
    busboy.end(req.rawBody);
    
}

exports.readCSVdata = function(filePath)
{
    const csv=require('csvtojson')
    return new Promise(function(resolve , reject){
        csv().fromFile(filePath[0]).then((jsonObj)=>{
            resolve(jsonObj);
        }).catch((err) => {
            reject(err);
        });
    });
}


exports.readCSVFromRemoteSource = function(filePath) {
    const request=require('request')
    const csv=require('csvtojson')

    return new Promise(function (res , rej) {

        csv()
            .fromStream(request.get(filePath))
            .subscribe((json)=>{
                console.log(json);
                return new Promise((resolve,reject)=>{
                    console.log(json);
                    resolve(json)
                })
            },function (err) {
                rej(err);
            },function (json) {
                res(json);
            });
    })


}

exports.externalHit = function(url , isPost , data)
{
    var request = require('request');
    
    return new Promise(function(resolve , reject){
        
        if(!isPost)
        {
            
            request(url, function (error, response, body) {
                resolve({
                    'error' : error,
                    'statusCode' : response.statusCode,
                    'body' : JSON.parse(body)
                });
            });
            
        }else{
            request.post({url:url, form: data}, function(err,httpResponse,body){ 
                var response = {
                    'err' : err,  
                    'httpResponse' : httpResponse,  
                    'body' : body,  
                };
            });
            resolve(response);
        }
        
    });
        
}

exports.makeNotificationData = function(notificationData , customData , replacers , device_token)
{
    var striptags = require('striptags');

    let notificationBody = notificationData.body;

    let notificationReplacers = notificationData['replacer'].split(',');
    
    notificationReplacers.map(function(wildcard, index){
        if(wildcard != '')
      notificationBody =  notificationBody.replace(wildcard, replacers[index]);
    });


    customData.notificationDescription = notificationBody;

    customData = JSON.stringify(customData);

    notificationBody = striptags(notificationBody);
    
    notification = {
        'title' :  notificationData.title,
        'body' : notificationBody,
    };
    
    return {
        "token" : device_token,
        "notification": notification,
        "data" : {
            customData
        },
        "android": {
            "notification": {
                "sound": "default"
            }
        },
        "apns": {
            "payload": {
                "aps": {
                    "sound": "default"
                }
            }
        }
    };
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
exports.shuffle = function(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

