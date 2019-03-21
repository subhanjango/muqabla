const vars = require('../customs/preReqs'),
      customHelpers = require('../customs/customHelpers'),
      dbHelper = require('../customs/dbHelper');

exports.createDataFromExcelSheets = function(req , res) {
    //get params requested for this http request
    let requestedParams = vars.dataColumns.getColumnNames('data-from-excel-sheets');
    //validate params
    console.log(req.body);
    customHelpers.validatePostRequest(requestedParams , req)
    //if validation is successful 
        .then(function() {
            console.log('then',req.body);

            dbHelper.insertArrayOfObjects(JSON.parse(req.body.data) , req.body.module , vars)
                .then(function (response) {
                    //send happy msg to the client
                    customHelpers.sendSuccessResponse(customHelpers.createMsgForClient(vars.successMsg.added, response), res);
                }).catch(function (err) {

                console.log('err',err);
                //send error , as the file was not read properly
                customHelpers.sendErrorResponse(err, res);
            });

        })
        .catch(function(err){
            console.log(err);
            //requested params are not enough to add data
            customHelpers.sendErrorResponse(customHelpers.createMsgForClient(vars.errorMsgs.requestedParams, err) , res);
        });

}