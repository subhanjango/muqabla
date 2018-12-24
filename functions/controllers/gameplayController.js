const vars = require('../customs/preReqs'),
customHelpers = require('../customs/customHelpers'),
dbHelper = require('../customs/dbHelper'),
collectionName = 'gameplay';

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
        let roomId = req.body.gameID;
        //call db function to add to data to db
        dbHelper.addToRealTimeDb(collectionName , roomId , customHelpers.generateUUID() ,req.body , vars)
        .then(function(data) {
           // dbHelper.updateLeaderboard(data.ref , roomId ,vars);
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.added , data) , res );
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

/* 
    Function to get documents
*/

exports.get = function(req , res)
{
   //if client has sent limit
    if(req.query.ref_id)
    {
        //over write limit
        var ref_id = req.query.ref_id;
    }
    //request for fetching data
    var data = dbHelper.getFromRealtimeDb(collectionName , ref_id , vars);
    // data recieved
    data.then(function(snapshot) {
            //time to send success response to client
            customHelpers.sendSuccessResponse(
                customHelpers.createMsgForClient(vars.successMsg.dataRetrieved , snapshot) , 
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
    requestedParams = vars.dataColumns.getColumnNames('delete');    
    //validate request with the required params
    customHelpers.validatePostRequest(requestedParams , req)
    .then(function(){   

           //call db function to delete data from db
           dbHelper.deleteFromRealTimeDb(collectionName , req.body.ref_id , vars)
           .then(function() {
               //data has been deleted - send success msg
                 customHelpers.sendSuccessResponse(
                     customHelpers.createMsgForClient(vars.successMsg.deleted , req.body) , 
                     res 
                );
           }).catch(function(err) {
               //Opps ! There was an error while deleting data - send error msg
                customHelpers.sendErrorResponse(err , res);
           }); 
        
    })
    .catch(function(){
        //requested params are not enough to delete data
        customHelpers.sendErrorResponse(
            customHelpers.createMsgForClient(vars.errorMsgs.requestedParams , requestedParams) 
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


exports.matchMeUp = function(req ,res)
{
    let collectionName = 'matchup';
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames(collectionName);
    //validate params
    customHelpers.validatePostRequest(requestedParams , req)
    //if validation is successful 
    .then(function(){
        //call db function to add to data to db
        dbHelper.addToRealTimeDb(collectionName , 'pending_players' , customHelpers.generateUUID() ,req.body , vars)
        .then(function(data) {
           // dbHelper.updateLeaderboard(data.ref , roomId ,vars);
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.added , data) , res );
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

exports.submitSinglePlayerResult = function(req , res)
{
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames('submitSinglePlayerResult');
    //validate params
    customHelpers.validatePostRequest(requestedParams , req)
    //if validation is successful 
    .then(function(){
        //call db function to add to data to db
        dbHelper.submitSinglePlayerResult(req.body , vars)
        .then(function(data) {
           // dbHelper.updateLeaderboard(data.ref , roomId ,vars);
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.added , data) , res );
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

exports.leaderboard = function(req , res)
{
        dbHelper.leaderboard(vars)
        .then(function(data) {
           // dbHelper.updateLeaderboard(data.ref , roomId ,vars);
            //data has been added - send success msg
              customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.dataRetrieved , data) , res );
        }).catch(function(err) {
            //Opps ! There was an error while adding data - send error msg
             customHelpers.sendErrorResponse(err , res );
        });
}

exports.search = function(req ,res)
{
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames('search');
    //validate params
    customHelpers.validatePostRequest(requestedParams , req)
    //if validation is successful 
    .then(function(){
        //call db function to add to data to db
        dbHelper.search(req.body.keyword , vars)
        .then(function(data) {
             customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.dataRetrieved , {'users' : data['users'] , 'categories' : data['categories']}) , res );
        }).catch(function(err) {
            console.log(err);

            //Opps ! There was an error while adding data - send error msg
             customHelpers.sendErrorResponse(err , res );
        });
    })
    .catch(function(){
        //requested params are not enough to add data
        customHelpers.sendErrorResponse(customHelpers.createMsgForClient(vars.errorMsgs.requestedParams , requestedParams) , res);
    });
}

