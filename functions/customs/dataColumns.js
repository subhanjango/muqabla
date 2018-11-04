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
    }
}