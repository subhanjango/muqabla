//pre defined variables
const vars = require('./customs/preReqs.js');

//controllers
const gameplay_controller = require('./controllers/gameplayController.js');
const questions_controller = require('./controllers/questionsController.js');
const users_controller = require('./controllers/usersController.js');
const categories_controller = require('./controllers/categoriesController.js');
const follow_category_controller = require('./controllers/followCategoryController.js');
const follow_user_controller = require('./controllers/followUserController.js');
const custom_controller = require('./controllers/customController.js');

var crudModules = [
    { 'module_name': 'Gameplay', 'controller': gameplay_controller },
    { 'module_name': 'Questions', 'controller': questions_controller },
    { 'module_name': 'User', 'controller': users_controller },
    { 'module_name': 'Categories', 'controller': categories_controller },
    { 'module_name': 'followCategory', 'controller': follow_category_controller },
    { 'module_name': 'followUser', 'controller': follow_user_controller },
];

//routes
/*/ crud routes /*/
for (let i = 0; i < crudModules.length; i++) {
    vars.app.post('/create' + crudModules[i].module_name, crudModules[i]['controller'].create);
    vars.app.get('/get' + crudModules[i].module_name, crudModules[i]['controller'].get);
    vars.app.post('/delete' + crudModules[i].module_name, crudModules[i]['controller'].delete);
    vars.app.post('/fullUpdate' + crudModules[i].module_name, crudModules[i]['controller'].fullUpdate);
    vars.app.post('/chunkUpdate' + crudModules[i].module_name, crudModules[i]['controller'].chunkUpdate);
}

vars.app.post('/matchMeUp' , gameplay_controller.matchMeUp);
vars.app.post('/removeFromQueue' , gameplay_controller.removeFromQueue);
vars.app.post('/submitSinglePlayerResult' , gameplay_controller.submitSinglePlayerResult);
vars.app.post('/search' , gameplay_controller.search);
vars.app.post('/submitMultiplayerPlayerResult' , gameplay_controller.submitMultiplayerPlayerResult);
vars.app.post('/endRoom' , gameplay_controller.endRoom);
vars.app.post('/challenge' , gameplay_controller.challenge);
vars.app.post('/acceptChallenge' , gameplay_controller.acceptChallenge);
vars.app.post('/rejectChallenge' , gameplay_controller.rejectChallenge);
vars.app.get('/leaderboard' , gameplay_controller.leaderboard);

vars.app.get('/getQuestionsForGame' , questions_controller.getQuestions);

vars.app.get('/followCategoryByUser' , follow_category_controller.followCategoryByUser);

vars.app.get('/getAllCategories' , categories_controller.getAllCategories);
vars.app.get('/categoryDetails' , categories_controller.categoryDetails);

vars.app.post('/removeFollowUser' , follow_user_controller.removeFollowUser);
vars.app.get('/getFollowFollowingUsers' , follow_user_controller.getFollowFollowingUsers);

vars.app.post('/customNotificationToUsers' , users_controller.sendCustomNotificationsToUsers);

vars.app.post('/createDataFromExcel' , custom_controller.createDataFromExcelSheets);
vars.app.get('/getAppStatus' , custom_controller.showAppStatus);



//listener for user registration
exports.userLogger = vars.functions.auth.user().onCreate((user) => {
    users_controller.create(user);
});


exports.api = vars.functions.https.onRequest(vars.app);
