//pre defined variables
const vars = require('./customs/preReqs.js');

//controllers
const gameplay_controller = require('./controllers/gameplayController.js');
const questions_controller = require('./controllers/questionsController.js');
const users_controller = require('./controllers/usersController.js');
const categories_controller = require('./controllers/categoriesController.js');

var crudModules = [
    { 'module_name': 'Gameplay', 'controller': gameplay_controller },
    { 'module_name': 'Questions', 'controller': questions_controller },
    { 'module_name': 'User', 'controller': users_controller },
    { 'module_name': 'Categories', 'controller': categories_controller },
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
vars.app.get('/getQuestionsForGame' , questions_controller.getQuestions);

//listener for user registration
exports.userLogger = vars.functions.auth.user().onCreate((user) => {
    users_controller.create(user);
});

exports.api = vars.functions.https.onRequest(vars.app);
