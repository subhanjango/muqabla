exports.getColumnNames = function (collection)
{
    switch(collection)
    {
        case 'questions':
        return  [
            {'param' : 'question' , 'description' : 'question description' ,  'data_type' : 'string' , 'required' : true},
            { 'param': 'answer', 'description': 'the correct answer', 'data_type': 'string' , 'required' : true},
            { 'param': 'options', 'description': 'options for the question asked', 'data_type': 'array of objects' , 'required' : true},
            { 'param': 'media', 'description': 'media file for question', 'data_type': 'file' ,'required' : false},
            { 'param': 'media_type', 'description': 'media type uploaded', 'data_type': 'string', 'required': false },
            { 'param': 'category', 'description': 'category for the question (id)', 'data_type': 'string', 'required': true },
        ];
        break;
        case 'delete':
        return [
            { 'param': 'ref_id', 'description': 'ref id of the document that needs to be deleted', 'data_type': 'string' ,'required' : true}
        ]
        break;
        case 'update':
        return [
            { 'param': 'ref_id', 'description': 'ref id of the document that needs to be updated', 'data_type': 'string' , 'required' : true}
        ]
        break;
        case 'categories':
        return [
            {'param' : 'title' , 'description' : 'category title' , 'data_type' : 'string' ,'required' : true},
            {'param' : 'description' , 'description' : 'burb for the category' , 'required' : true},
            {'param' : 'parent_category' , 'description' : 'parent category id if present' , 'required' : false},
        ];
        break;
        case 'users':
        return [
            {'param' : 'displayName' , 'description' : 'user name' , 'required' : false},
            {'param' : 'emailVerified' , 'description' : 'user email is verified?' , 'required' : false},
            {'param' : 'ref_id' , 'description' : 'user ref id' , 'required' : true},
            {'param' : 'phoneNumber' , 'description' : 'user phoneNumber' , 'required' : false},
            {'param' : 'photoURL' , 'description' : 'user avatar' , 'required' : false},
            {'param' : 'total_points' , 'description' : 'user total points in game' , 'required' : false},
            {'param' : 'games_played' , 'description' : 'user total games played' , 'required' : false},
            {'param' : 'games_voted' , 'description' : 'user voted in games' , 'required' : false},
            {'param' : 'games_won' , 'description' : 'user total wins' , 'required' : false},
            {'param' : 'current_exp' , 'description' : 'current exp of the user' , 'required' : false},
            {'param' : 'milestone_reached' , 'description' : 'current milestone of the user' , 'required' : false}
        ];
        break;
        case 'matchup':
        return [
            {'param' : 'user' , 'description' : 'user object' , 'data_type': 'object' ,'required' : false},
            {'param' : 'category_chosen' , 'description' : 'category id that has been chosen by user' , 'data_type': 'string' , 'required' : true},
            {'param' : 'current_level' , 'description' : 'user current level' , 'data_type': 'integer' , 'required' : true},
        ];
        break;
        case 'getQuestions':
        return [
            {'param' : 'category_id' , 'description' : 'category_id' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'followCategory':
        return [
            {'param' : 'categoryID' , 'description' : 'category id to follow' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'userID' , 'description' : 'follower id' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'followUser':
        return [
            {'param' : 'following_user_id' , 'description' : 'id of the user who will be followed' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'follower_user_id' , 'description' : 'id of the user who will follow' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'followCategoryByUser':
        return [
            {'param' : 'userID' , 'description' : 'follower id' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'getAllCategories':
        return [
            {'param' : 'userID' , 'description' : 'user id' , 'data_type': 'string'  , 'required' : false},
        ];
        break;
        case 'categoryDetails':
        return [
            {'param' : 'categoryID' , 'description' : 'category id' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'userID' , 'description' : 'user id' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'submitSinglePlayerResult':
        return [
            {'param' : 'userID' , 'description' : 'user id' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'correctAnswer' , 'description' : 'correct answer (1 : yes , 0 : no)' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'allCorrectAnswer' , 'description' : 'all correct answers (1 : yes , 0 : no)' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'win' , 'description' : 'win (1)' , 'data_type': 'string'  , 'required' : false},
            {'param' : 'draw' , 'description' : 'draw (1)' , 'data_type': 'string'  , 'required' : false},
            {'param' : 'losed' , 'description' : 'lose (1)' , 'data_type': 'string'  , 'required' : false},
            {'param' : 'categoryTitle' , 'description' : 'playing category title' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'categoryID' , 'description' : 'playing category id' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'search':
        return [
            {'param' : 'keyword' , 'description' : 'keyword to search' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'user_id' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'leaderboard':
        return [
            {'param' : 'categoryID' , 'description' : 'category id' , 'data_type': 'string'  , 'required' : true}
        ];
        break;
        case 'removeFollow':
        return [
            {'param' : 'following_user_id' , 'description' : 'id of the user who will be followed' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'follower_user_id' , 'description' : 'id of the user who will follow' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'matchMeUp':
        return [
            {'param' : 'user_id' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'category_id' , 'description' : 'category id that has been selected' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'removeFromQueue':
        return [
            {'param' : 'user_id' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'category_id' , 'description' : 'category id that has been selected' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'endRoom':
        return [
            {'param' : 'roomID' , 'description' : 'room id' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'categoryID' , 'description' : 'category id that has been selected' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'submitMultiplayerPlayerResult':
        return [
            {'param' : 'playerID' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'categoryID' , 'description' : 'category id that has been selected' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'roomID' , 'description' : 'room id' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'rightAnswer' , 'description' : '1 if yes , 0 if no' , 'data_type': 'string'  , 'required' : true},
        ];
        break;
        case 'challenge':
        return [
            {'param' : 'challenger' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'challenged' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'categoryID' , 'description' : 'category id that has been selected' , 'data_type': 'string'  , 'required' : true},
        ]
        break;
        case 'rejectChallenge':
        return [
            {'param' : 'challengeID' , 'description' : 'challenge guid' , 'data_type': 'string'  , 'required' : true},
        ]
        break;
        case 'acceptChallenge':
        return [
            {'param' : 'challengeID' , 'description' : 'challenge guid' , 'data_type': 'string'  , 'required' : true},
        ]
        break;
        case 'getFollowFollowingUsers':
        return [
            {'param' : 'type' , 'description' : 'following | followers' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'user_id' , 'description' : 'user guid' , 'data_type': 'string'  , 'required' : true},
        ]
        break;
        case 'data-from-excel-sheets':
        return [
            {'param' : 'module' , 'description' : 'module name' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'data' , 'description' : 'array of objects' , 'data_type': 'array'  , 'required' : true},
        ]
        break;
        case 'sendCustomNotificationsToUsers':
        return [
            {'param' : 'title' , 'description' : 'title of the notificaiton' , 'data_type': 'string'  , 'required' : true},
            {'param' : 'msg' , 'description' : 'body of the notification' , 'data_type': 'string'  , 'required' : true},
        ]
        break;
    
    }
}