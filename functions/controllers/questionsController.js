const vars = require('../customs/preReqs'),
customHelpers = require('../customs/customHelpers'),
dbHelper = require('../customs/dbHelper'),
collectionName = 'questions';

/* 
    Function to create document
*/

exports.create = function (req , res)
{
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames(collectionName);
    //validate params
    customHelpers.validatePostRequest(requestedParams , req)
    //if validation is successful 
    .then(function(){
        req.body.random = customHelpers.generateReadableCode();
        //call db function to add to data to db
        dbHelper.addToDb(collectionName , customHelpers.generateUUID() , req.body , vars)
        .then(function() {
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.added , req.body) , res );
        }).catch(function(err) {
            //Opps ! There was an error while adding data - send error msg
             customHelpers.sendErrorResponse(err , res );
        });
    })
    .catch(function(err){
        //requested params are not enough to add data
        customHelpers.sendErrorResponse(customHelpers.createMsgForClient(vars.errorMsgs.requestedParams, err) , res);
    });

}

/* 
    Function to get documents
*/

exports.get = function(req , res)
{
    //default limit
    var limit = 10;
    //default offset
    var offset = 0;
    //default column value for where clause
    var specificColumn = 0;
    //default column name for where clause
    var findFrom = '';
    //default order by from created_at key
    var orderBy = 'created_at';

    //if client has sent limit
    if(req.query.limit)
    {
        //over write limit
        limit = req.query.limit;
    }
    //if client has sent offset
    if(req.query.offset)
    {
        //over write offset
        offset = req.query.offset;
    }
    //if client has sent findFrom
    if(req.query.findFrom)
    {
        //over write findFrom
        findFrom = req.query.findFrom;
    }
    //if client has sent specificColumn
    if(req.query.specificColumn)
    {
        //over write specificColumn
        specificColumn = req.query.specificColumn;
    }
    //if client has sent orderBy
    if(req.query.orderBy)
    {
        //over write orderBy
        orderBy = req.query.orderBy;
    }
    //request for fetching data
    var data = dbHelper.getData(offset , limit , collectionName , findFrom ,specificColumn , orderBy ,vars);
    // data recieved
    data.then(function(snapshot) {
        //convert data set into array
        var dataRecieved =   snapshot.docs.map(function (documentSnapshot) {
                return documentSnapshot.data();
            });
            //time to send success response to client
            customHelpers.sendSuccessResponse(
                customHelpers.createMsgForClient(vars.successMsg.dataRetrieved , dataRecieved) , 
                res
            );
        })
        //unable to recieve data
        .catch(function(err){
            //Oops ! send error to client
            customHelpers.sendErrorResponse(
                customHelpers.createMsgForClient(vars.errorMsgs.ServerError , err) , 
                res
            );
        });

}

/* 
    Function to delete document
*/

exports.delete = function(req , res)
{
//get required params for this request -- overwrite the above requestedParams variable
let requestedParams = vars.dataColumns.getColumnNames('delete');    

//validate request with the required params
customHelpers.validatePostRequest(requestedParams , req)
.then(function(){   
//call db function to delete data from db
dbHelper.deleteFromDb(collectionName , req.body.ref_id , vars);
//data has been deleted - send success msg
customHelpers.sendSuccessResponse(
    customHelpers.createMsgForClient(vars.successMsg.deleted , req.body) , 
    res 
    );

})
.catch(function(err){
    console.log('here4',err);
//requested params are not enough to delete data
customHelpers.sendErrorResponse(
    customHelpers.createMsgForClient(vars.errorMsgs.requestedParams , err) 
    , 
    res
    );
});
}

/* 
    Function to update the document completely 
*/

exports.fullUpdate = function(req , res)
{
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames(collectionName);
    //validate request with the required params 
    customHelpers.validatePostRequest(requestedParams , req)
    .then(function(){   
            let ref_id = req.body.ref_id;
            delete req.body['ref_id']; 
           //call db function to update data
           dbHelper.fullUpdate(collectionName , ref_id , req.body ,vars)
           .then(function() {
               //data has been updated - send success msg
            customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.updated , req.body) , res );
           }).catch(function(err) {
               //Opps ! There was an error while updating data - send error msg
                customHelpers.sendErrorResponse(err , res);
           }); 
        
    })
    .catch(function(){
        //requested params are not enough to update data
        customHelpers.sendErrorResponse(customHelpers.createMsgForClient(vars.errorMsgs.requestedParams , requestedParams) , res);
    });
}

/* 
    Function to update a specific chunk of the document
*/

exports.chunkUpdate = function(req , res)
{
    let ref_id = req.body.ref_id;
    delete req.body['ref_id']; 
    //call db function to update data 
    dbHelper.chunkUpdate(collectionName , ref_id , req.body ,vars)
    .then(function(snapshot) {
        //data has been updated - send success msg with new data
     customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.updated , snapshot) , res );
    }).catch(function(err) {
        //Opps ! There was an error while updating data - send error msg
         customHelpers.sendErrorResponse(err , res);
    }); 
}

exports.getQuestions = function(req ,res)
{
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames('getQuestions');
    //validate params

    customHelpers.validateGetRequest(requestedParams , req)
    //if validation is successful 
    .then(function(){
        //call db function to add to data to db
        dbHelper.getQuestions(req.query.category_id , vars )
        .then(function(data) {
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.dataRetrieved , data) , res );
        }).catch(function(err) {
            //Opps ! There was an error while adding data - send error msg
             customHelpers.sendErrorResponse(err , res );
        });
    })
    .catch(function(){
        //requested params are not enough to add data
        customHelpers.sendErrorResponse(customHelpers.createMsgForClient(vars.errorMsgs.requestedParams , requestedParams) , res);
    });
}