let customHelper = require('./customHelpers');

const notificationsCollection = 'notifications';

const presenceCollection = 'presence';

var uploadFileOnRemoteServer = function (file, vars) {
    var error = '';
    return new Promise(
        function (resolve, reject) {
            var uploadTask = vars.storage.child('wordPlayList/' + file.name).put(file);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                function (snapshot) {
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
                }, function (error) {

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
                }, function () {
                    // Upload completed successfully, now we can get the download URL
                    uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                        success = downloadURL;
                    });
                });

            if (error != '') {
                reject(error);
            } else {
                resolve(success);
            }
        }
    );

}

var addToDb = function (collection, uniqueID, data, vars) {
    return new Promise(function (resolve, reject) {

        data.guid = uniqueID;
        data.created_at = new Date().getTime();
        data.deleted_at = null;

        vars.db.collection(collection).doc(uniqueID).set(data).then((response) => {
            resolve(response);
        }).catch((err) => {
            console.log('add data',err);
            reject(vars.errorMsgs.adderror);
        });

    });
}

var getData = function (offset, limit, collection, findFrom, specificColumn, orderBy, vars) {
    var query = vars.db.collection(collection);
    if (specificColumn && findFrom) {
        query = query.where(findFrom, '==', specificColumn);
    } else if (offset && limit) {
        query = query.startAfter(offset)
            .limit(limit);
    } else if (orderBy) {
        query = query.orderBy(orderBy);
    } else {
        query = query.orderBy('created_at');
    }

    return query.where('deleted_at', '==', null).get();
}


var deleteFromDb = function (collectionName, refID, vars, permenant = false) {

    let ref = vars.db.collection(collectionName).doc(refID);

    if (!permenant) {
        ref.update('deleted_at', new Date().getTime());
    } else {
        ref.delete();
    }

    return ref;
}

var fullUpdate = function (collectionName, refID, params, vars) {
    return vars.db.collection(collectionName).doc(refID).set(params);
}

var chunkUpdate = function (collectionName, refID, request, vars) {
    return vars.db.collection(collectionName).doc(refID).update(request);
}


var alreadyExist = function (collection, column, dataToCheck, vars) {
    return vars.db.collection(collection).where(column, '==', dataToCheck).get();
}


var addToRealTimeDb = function (collection, parentID, uniqueID, data, vars) {
    return new Promise(function (resolve, reject) {

        data.guid = uniqueID;
        data.created_at = new Date().getTime();
        data.deleted_at = null;
        let ref = vars.rtdb.ref(collection + '/' + parentID + '/' + uniqueID);
        var dataToSave = ref.set(data);

        if (dataToSave) {
            let data = getFromRealtimeDb(collection, parentID, vars);
            if (data) {
                data.ref = vars.rtdb.ref(collection + '/' + parentID + '/');
                resolve(data);
            }
        } else {
            reject(vars.errorMsgs.adderror);
        }
    });

}

var getFromRealtimeDb = function (collection, refID, vars) {
    return new Promise(function (resolve, reject) {
        vars.rtdb.ref('/' + collection + '/' + refID + '/').once('value')
            .then(function (snapshot) {
                resolve(snapshot.val());
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var removeFromRealtimeDb = function (path, vars) {
    return vars.rtdb.ref(path).remove();
}

var getQuestions = function (categoryID, vars) {
    return new Promise(function (resolve, reject) {

        queryRef = vars.db.collection('questions')
            .where("category", "==", categoryID)
            .get();

        queryRef.then(function (snapshot) {


            let dataRecieved = snapshot.docs.map(function (documentSnapshot) {
                return documentSnapshot.data();
            });


            if (dataRecieved.length <= vars.questionPerRound) {
                resolve(dataRecieved);
            }

            makeRandomQuestions(dataRecieved, vars.questionPerRound)
                .then(function (questions) {
                    resolve(questions);
                })
                .catch(function (err) {
                    reject(err);
                })


        }).catch(function (err) {
            reject(err);
        });

    });

}

var makeRandomQuestions = function (questions, questionsCount) {
    return new Promise(function (resolve, reject) {
        let questionsArr = [];
        let questionsUniqueRecord = [];

        while (questionsArr.length != questionsCount) {
            let currQuestion = questions[Math.floor(Math.random() * questions.length)];

            if (questionsUniqueRecord.indexOf(currQuestion.guid) == -1) {
                questionsUniqueRecord.push(currQuestion.guid);

                questionsArr.push(currQuestion);
            }

            if (questionsArr.length == questionsCount) {
                resolve(questionsArr);
            }
        }

    });
}

var followCategoryByUser = function (userID, collection, vars) {
    return new Promise(function (resolve, reject) {

        let categoriesFollowed = getData(false, false, collection, 'userID', userID, false, vars);

        categoriesFollowed.then(function (snapshot) {
            let dataRecieved = snapshot.docs.map(function (documentSnapshot) {
                return documentSnapshot.data();
            });

            let categoryFollowed = [];
            let incr = 1;
            for (let i = 0; i < dataRecieved.length; i++) {

                categoryDetails = getData(false, false, 'categories', 'guid', dataRecieved[i].categoryID, false, vars);

                categoryDetails.then(function (snapshot) {

                    let categoryData = snapshot.docs.map(function (documentSnapshot) {
                        let res = documentSnapshot.data();

                        res.following_guid = dataRecieved[i].guid;

                        return res;
                    });

                    if (!categoryData[0]) {
                        categoryData[0] = {};
                    }

                    let categoryGUID = categoryData[0].guid ? categoryData[0].guid : 0;

                    Promise.all([
                        categoryFollowers(categoryGUID, vars),
                        isFollowingCategory(categoryGUID, userID, vars),
                        getCategoryChildren(categoryGUID, vars),
                        countGamesPlayedOnCategory(categoryGUID, vars)
                    ])
                        .then(function (arr) {

                            categoryData[0].followers = arr[0];
                            categoryData[0].is_following = arr[1];
                            categoryData[0].children = arr[2];
                            categoryData[0].games_played = arr[3];

                            if (categoryData[0].guid) {
                                categoryFollowed.push(categoryData[0]);
                            }

                            if (dataRecieved.length === incr) {
                                resolve(categoryFollowed);

                            }
                            incr++;

                        }).catch(function (err) {
                        reject(err)
                    });

                }).catch(function (err) {
                    console.log('err', err);
                    reject(err);
                });

            }

            if (!dataRecieved.length) {
                resolve(categoryFollowed);
            }
        }).catch(function (err) {
            reject(err);
        });
    });
}

var getAllCategories = function (userID, vars) {
    return new Promise(function (resolve, reject) {

        let user_id;

        if (userID) {
            user_id = userID;
        } else {
            user_id = 0;
        }

        let getAllCategories = getData(false, false, 'categories', false, false, false, vars);

        getAllCategories.then(function (snapshot) {
            let res = [];
            let incr = 1;
            snapshot.docs.map(function (documentSnapshot) {

                let response = documentSnapshot.data();

                Promise.all([
                    categoryFollowers(response.guid, vars),
                    isFollowingCategory(response.guid, user_id, vars),
                    getCategoryChildren(response.guid, vars),
                    countGamesPlayedOnCategory(response.guid, vars)
                ])
                    .then(function (arr) {
                        response.followers = arr[0];
                        response.is_following = arr[1];
                        response.children = arr[2];
                        response.games_played = arr[3];

                        if ((!response.is_featured && !response.parent_category) || (response.parent_category == 0 && response.parent_category == 0)) {
                            res.push(response);
                        }

                        if (incr === snapshot.size) {
                            resolve(res);
                        }
                        incr++;
                    });
            });

        }).catch(function (err) {
            reject(err);
        });

    });
}


var categoryDetails = function (categoryID, userID, vars) {
    return new Promise(function (resolve, reject) {

        let getAllCategories = getData(false, false, 'categories', 'guid', categoryID, false, vars);

        getAllCategories.then(function (snapshot) {
            let res = [];
            snapshot.docs.map(function (documentSnapshot) {

                let response = documentSnapshot.data();

                Promise.all([
                    categoryFollowers(response.guid, vars),
                    isFollowingCategory(response.guid, userID, vars),
                    getFollowingGUID(response.guid, userID, vars),
                    getCategoryChildren(response.guid, vars),
                    countGamesPlayedOnCategory(response.guid, vars),
                ])
                    .then(function (arr) {
                        response.followers = arr[0];
                        response.is_following = arr[1];
                        response.following_guid = arr[2];
                        response.children = arr[3];
                        response.games_played = arr[4];

                        res.push(response);

                        if (res.length === snapshot.size) {
                            resolve(res[0]);
                        }
                    });
            });

        }).catch(function (err) {
            console.log(err);
            reject(err);
        });

    });
}


var categoryFollowers = function (categoryId, vars) {

    return new Promise(function (resolve, reject) {

        let getAllCategories = getData(false, false, 'followCategory', 'categoryID', categoryId, false, vars);
        getAllCategories.then(function (snapshot) {

            resolve(snapshot.size);
        })
            .catch(function (err) {
                reject(err);
            });

    });

}

var isFollowingCategory = function (categoryID, userID, vars) {
    return new Promise(function (resolve, reject) {

        let getAllCategories = getData(false, false, 'followCategory', 'categoryID', categoryID, false, vars);

        getAllCategories.then(function (snapshot) {

            let isFollowing = 0;

            snapshot.docs.map(function (documentSnapshot) {
                if (documentSnapshot.data().userID === userID) {
                    isFollowing = 1;
                }
            });

            resolve(isFollowing);
        })
            .catch(function (err) {
                reject(err);
            });

    });

}

var getFollowingGUID = function (categoryID, userID, vars) {
    return new Promise(function (resolve, reject) {

        let getAllCategories = getData(false, false, 'followCategory', 'categoryID', categoryID, false, vars);

        getAllCategories.then(function (snapshot) {

            let followingGUID = 0;

            snapshot.docs.map(function (documentSnapshot) {
                if (documentSnapshot.data().userID === userID) {
                    followingGUID = documentSnapshot.data().guid;
                }
            });

            resolve(followingGUID);
        })
            .catch(function (err) {
                reject(err);
            });

    });

};

var getCategoryChildren = function (categoryID, vars) {
    return new Promise(function (resolve, reject) {

        let getAllCategories = getData(false, false, 'categories', 'parent_category', categoryID, false, vars);

        getAllCategories.then(function (snapshot) {

            let dataRecieved = snapshot.docs.map(function (documentSnapshot) {
                return documentSnapshot.data();
            });

            resolve(dataRecieved);
        })
            .catch(function (err) {
                reject(err);
            });
    });
}

var submitSinglePlayerResult = function (request, vars) {
    return new Promise(function (resolve, reject) {

        let user = getData(false, false, 'users', 'guid', request.userID, false, vars);

        user.then(function (userData) {

            let dataRecieved = userData.docs.map(function (documentSnapshot) {
                return documentSnapshot.data();
            });

            let categoryID = request.categoryID;

            dataRecieved = dataRecieved[0];

            if (!dataRecieved.nextLevelRequirement) {
                dataRecieved.nextLevelRequirement = 100;
            }

            if (request.correctAnswer && request.correctAnswer == 1) {
                dataRecieved.current_points = dataRecieved.current_points ? parseInt(dataRecieved.current_points) + 10 : 10;
            }

            if (request.allCorrectAnswer && request.allCorrectAnswer == 1) {
                dataRecieved.current_points = dataRecieved.current_points ? parseInt(dataRecieved.current_points) + 20 : 20;
            }

            if (request.win && request.win == 1) {
                dataRecieved.games_won = dataRecieved.games_won ? parseInt(dataRecieved.games_won) + 1 : 1;

                let alreadyWonCategories = dataRecieved.won_categories ? dataRecieved.won_categories : {};

                alreadyWonCategories[generateUUID()] =
                    {
                        'title': request.categoryTitle,
                        'categoryId': categoryID,

                    };

                getFromRealtimeDb('leaderboard', categoryID + '/' + dataRecieved.guid, vars)
                    .then(function (result) {
                        if (!result) {
                            result = dataRecieved;
                        }

                        result.wins = result.wins ? parseInt(result.wins) + 1 : 1;

                        addToRealTimeDb('leaderboard', categoryID, dataRecieved.guid, result, vars);

                    }).catch(function (err) {
                    console.log('leaderboard err', err);
                });

                dataRecieved.won_categories = alreadyWonCategories;

            }

            if (request.draw && request.draw == 1) {
                dataRecieved.games_draw = dataRecieved.games_draw ? parseInt(dataRecieved.games_draw) + 1 : 1;

            }

            if (request.losed && request.losed == 1) {
                dataRecieved.games_losed = dataRecieved.games_losed ? parseInt(dataRecieved.games_losed) + 1 : 1;
            }

            if (request.win == 1 || request.losed == 1 || request.draw == 1) {

                let alreadyPlayedCategories = dataRecieved.played_categories ? dataRecieved.played_categories : {};

                alreadyPlayedCategories[generateUUID()] = {
                    'title': request.categoryTitle,
                    'categoryId': categoryID
                };

                dataRecieved.played_categories = alreadyPlayedCategories;

                dataRecieved.games_played = dataRecieved.games_played ? parseInt(dataRecieved.games_played) + 1 : 1;


                if (parseInt(dataRecieved.current_exp) % 30 == 0) {
                    dataRecieved.total_points = dataRecieved.total_points ? parseInt(dataRecieved.total_points) + 10 : 10;
                }

                if (parseInt(dataRecieved.games_played) % 3 == 0) {
                    dataRecieved.total_points = dataRecieved.total_points ? parseInt(dataRecieved.total_points) + 10 : 10;
                }


            }

            if (dataRecieved.current_points >= dataRecieved.nextLevelRequirement) {
                dataRecieved.current_points = 0;
                dataRecieved.current_exp = dataRecieved.current_exp ? parseInt(dataRecieved.current_exp) + 1 : 1;
            }

            addToDb('users', request.userID, dataRecieved, vars);
            resolve(dataRecieved);
        })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });

    });
}

var leaderboard = function (categoryID, vars) {
    return new Promise(function (resolve, reject) {

        getFromRealtimeDb('leaderboard', categoryID, vars)
            .then(function (data) {
                if (!data) {
                    resolve([]);
                }
                let ranks = [];
                let incr = 1;
                for (let key in data) {
                    ranks.push(data[key]);
                    if (incr === Object.keys(data).length) {
                        resolve(ranks.sort(compareWins).reverse());
                    }
                    incr++;
                }

            }).catch(function (err) {
            console.log('leaderboard retrieval err', err);
        });

    });
}

function compareWins(a, b) {
    if (a.wins < b.wins)
        return -1;
    if (a.wins > b.wins)
        return 1;
    return 0;
}

var checkUserFollowing = function (followerID, followingUserID, vars) {
    return new Promise(function (resolve, reject) {

        let queryData = vars.db.collection('followUser')
            .where('following_user_id', '==', followingUserID)
            .where('follower_user_id', '==', followerID)
            .get();

        queryData.then(function (snapshot) {
            resolve(snapshot.size);
        }).catch(function (err) {
            reject(err);
        });
    });

}

var search = function (keyword, user_id, vars) {
    return new Promise(function (resolve, reject) {

        let users = getData(false, false, 'users', false, false, false, vars);
        let categories = getData(false, false, 'categories', false, false, false, vars);
        let searchResults = [];

        searchResults['users'] = [];
        searchResults['categories'] = [];

        Promise.all([users, categories])
            .then(function (response) {

                let incr1 = 1;

                response[0].docs.map(function (documentSnapshot) {
                    let userSnapShot = documentSnapshot.data();

                    let username = userSnapShot['first_name'] ? userSnapShot['first_name'] : '';

                    if (username.toLowerCase().indexOf(keyword.toLowerCase().trim()) !== -1 && userSnapShot['guid'] != user_id) {
                        searchResults['users'].push(userSnapShot);
                    }

                    if (incr1 === response[0].size) {
                        let incr2 = 1;

                        response[1].docs.map(function (documentSnapshot) {

                            let categoriesSnapShot = documentSnapshot.data();

                            if (categoriesSnapShot['title'].toLowerCase().indexOf(keyword.toLowerCase().trim()) !== -1 && !categoriesSnapShot['is_featured']) {
                                searchResults['categories'].push(categoriesSnapShot);

                            }

                            if (incr2 === response[1].size) {
                                if (searchResults['users'].length == 0) {
                                    resolve(searchResults);
                                }

                                let incr3 = 1;
                                for (let key in searchResults['users']) {
                                    checkUserFollowing(user_id, searchResults['users'][key].guid, vars)
                                        .then(function (is_following) {

                                            searchResults['users'][key].is_following = is_following;

                                            if (incr3 == searchResults['users'].length) {
                                                resolve(searchResults);
                                            }
                                            incr3++;
                                        });
                                }
                            }

                            incr2++;
                        });
                    }
                    incr1++;
                });
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var generateUUID = function () {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

var removeFollowUser = function (request, vars) {
    return new Promise(function (resolve, reject) {

        let getDoc = vars.db.collection('followUser')
            .where('following_user_id', '==', request.following_user_id)
            .where('follower_user_id', '==', request.follower_user_id)
            .get();

        getDoc.then(function (querySnapshot) {

            querySnapshot.forEach(function (doc) {

                let rtdbPath = notificationsCollection + '/' + request.following_user_id + '/listing/' + doc.data().guid;

                removeFromRealtimeDb(rtdbPath, vars);
                decreaseNotificationCount(request.following_user_id, vars);
                doc.ref.delete();

            });

            //change follower and following count
            let senderData = alreadyExist('users', 'guid', request.follower_user_id, vars);
            let recieverData = alreadyExist('users', 'guid', request.following_user_id, vars);

            Promise.all([senderData, recieverData])
                .then(function (response) {

                    senderData = response[0].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    recieverData = response[1].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    let senderDataToUpdate = {'following_count': senderData[0].following_count ? parseInt(senderData[0].following_count) - 1 : 0};

                    chunkUpdate('users', request.follower_user_id, senderDataToUpdate, vars);
                    console.log();
                    let recieverDataToUpdate = {'follower_count': recieverData[0].follower_count ? parseInt(recieverData[0].follower_count) - 1 : 0};

                    chunkUpdate('users', request.following_user_id, recieverDataToUpdate, vars);

                })
                .catch(function (err) {
                    console.log('err', err);
                });

            resolve();
        });
    });
}

var increaseNotificationCount = function (userId, vars) {
    getFromRealtimeDb(notificationsCollection, userId + '/notification_count', vars)
        .then(function (response) {

            let count = 1;
            if (response) {
                count = parseInt(response) + count;
            }
            addToRealTimeDb(notificationsCollection, userId, 'notification_count', count, vars);

        }).catch(function (err) {
        console.log('err', err);
    });
}

var decreaseNotificationCount = function (userId, vars) {
    getFromRealtimeDb(notificationsCollection, userId + '/notification_count', vars)
        .then(function (response) {

            let count = 1;
            if (response) {
                count = parseInt(response) - count;
            }
            addToRealTimeDb(notificationsCollection, userId, 'notification_count', count, vars);

        }).catch(function (err) {
        console.log('err', err);
    });
}


var sendNotification = function (notificationData, vars) {
    return new Promise(function (resolve, reject) {
        // Send a message to the device corresponding to the provided
        // registration token.
        vars.firebase.messaging().send(notificationData)
            .then((response) => {
                // Response is a message ID string.
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

var pushNotifyUser = function (type, sender, reciever, firestoreGUID, vars) {
    let senderData = alreadyExist('users', 'guid', sender, vars);

    let recieverData = alreadyExist('users', 'guid', reciever, vars);

    switch (type) {
        case 'followUser':


            Promise.all([senderData, recieverData])
                .then(function (response) {

                    senderData = response[0].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    recieverData = response[1].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    let replacers = [
                        senderData[0].first_name
                    ];

                    let notifcationData = vars.notifications[type];

                    let customData = {
                        'senderID': senderData[0].guid,
                        'recieverID': recieverData[0].guid,
                        'notification_type': type,
                        'senderImage': senderData[0].image_url
                    };

                    let sendNotificationData = customHelper.makeNotificationData(
                        notifcationData,
                        customData,
                        replacers,
                        recieverData[0].device_token
                    );

                    let staticNotificationData = JSON.stringify(sendNotificationData);

                    let userID = recieverData[0].guid;

                    addToRealTimeDb(
                        notificationsCollection,
                        userID + '/listing',
                        firestoreGUID,
                        sendNotificationData,
                        vars
                    )
                        .then(function () {

                            increaseNotificationCount(userID, vars);

                            let senderDataToUpdate = {'following_count': senderData[0].following_count ? parseInt(senderData[0].following_count) + 1 : 1};

                            chunkUpdate('users', sender, senderDataToUpdate, vars);

                            let recieverDataToUpdate = {'follower_count': recieverData[0].follower_count ? parseInt(recieverData[0].follower_count) + 1 : 1};

                            chunkUpdate('users', reciever, recieverDataToUpdate, vars);

                            let notification_status = recieverData[0].notification_status ? recieverData[0].notification_status : 1;
                            console.log('noti', notification_status);
                            if (notification_status) {

                                sendNotification(JSON.parse(staticNotificationData), vars)
                                    .then(function (res) {
                                        console.log('res', res);
                                    }).catch(function (err) {
                                    console.log('err', err);
                                });
                            }

                        }).catch(function (err) {
                        console.log('err', err);
                    });


                })
                .catch(function (err) {
                    console.log('err', err);
                });

            break;

        case 'challengeUser':

            Promise.all([senderData, recieverData])
                .then(function (response) {

                    senderData = response[0].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    recieverData = response[1].docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    let replacers = [
                        senderData[0].first_name
                    ];

                    let notifcationData = vars.notifications[type];

                    let customData = {
                        'senderID': senderData[0].guid,
                        'recieverID': recieverData[0].guid,
                        'notification_type': type,
                        'senderImage': senderData[0].image_url
                    };

                    let sendNotificationData = customHelper.makeNotificationData(
                        notifcationData,
                        customData,
                        replacers,
                        recieverData[0].device_token
                    );

                    let staticNotificationData = JSON.stringify(sendNotificationData);

                    let userID = recieverData[0].guid;

                    addToRealTimeDb(
                        notificationsCollection,
                        userID + '/listing',
                        firestoreGUID,
                        sendNotificationData,
                        vars
                    )
                        .then(function () {

                            increaseNotificationCount(userID, vars);

                            let notification_status = recieverData[0].notification_status ? recieverData[0].notification_status : 1;

                            if (notification_status) {

                                sendNotification(JSON.parse(staticNotificationData), vars)
                                    .then(function (res) {
                                        console.log('res', res);
                                    }).catch(function (err) {
                                    console.log('err', err);
                                });
                            }

                        }).catch(function (err) {
                        console.log('err', err);
                    });


                })
                .catch(function (err) {
                    console.log('err', err);
                });

            break;
    }
}

var addToQueue = function (userID, categoryID, vars) {
    return new Promise(function (resolve, reject) {

        let userObj = getData(false, false, 'users', 'guid', userID, false, vars);

        userObj.then(function (response) {

            userData = response.docs.map(function (querySnapshot) {
                return querySnapshot.data();
            });


            checkAnyPlayerAvailable(userID, categoryID, vars)
                .then(function (result) {

                    createNewRoom(userData[0], result, categoryID, vars)
                        .then(function () {

                            let removeQueuePlayerPath = 'gameProgress/waiting/' + categoryID + '/' + result.guid;

                            removeFromRealtimeDb(removeQueuePlayerPath, vars);
                            resolve(userData[0]);

                        }).catch(function (err) {
                        reject();
                    });

                })
                .catch(function () {

                    var presenceRef = vars.rtdb.ref(presenceCollection + '/' + userID);

                    presenceRef.on('value', (snapshot) => {

                        if (snapshot.val() && snapshot.val().status == 'offline') {
                            console.log('val', snapshot.val());
                            let removeQueuePlayerPath = 'gameProgress/waiting/' + categoryID + '/' + userID;

                            console.log('removeQueuePlayerPath', removeQueuePlayerPath);
                            removeFromRealtimeDb(removeQueuePlayerPath, vars);
                        }

                    });

                    addToRealTimeDb('gameProgress', 'waiting/' + categoryID, userID, userData[0], vars)
                        .then(function () {
                            resolve(userData[0]);
                        })
                        .catch(function (err) {
                            reject();
                        })
                });

        }).catch(function (err) {
            reject(err);
        });

    });
}

var checkAnyPlayerAvailable = function (requestingUserID, categoryIDSelected, vars) {
    return new Promise(function (resolve, reject) {
        var queueRef = vars.rtdb.ref("gameProgress/waiting/" + categoryIDSelected);

        let incr = 1;

        queueRef.orderByKey().on("value", function (snapshot) {

            if (snapshot.numChildren() === 0) {
                reject();
            }

            snapshot.forEach(function (data) {

                if (data.key != requestingUserID) {
                    resolve(data.val());
                }

                if (snapshot.numChildren() === incr) {
                    reject();
                }

                incr++;
            });

        });
    });
}

var createNewRoom = function (player1Obj, player2Obj, categoryID, vars) {

    return new Promise(function (resolve, reject) {

        let newRoomID = customHelper.generateUUID();


        let playingInfo = {'room': newRoomID, 'category': categoryID};

        addToRealTimeDb('gameProgress', 'playing', player1Obj.guid, playingInfo, vars);

        addToRealTimeDb('gameProgress', 'playing', player2Obj.guid, playingInfo, vars);


        getQuestions(categoryID, vars)
            .then(function (questions) {

                let category = getData(false, false, 'categories', 'guid', categoryID, false, vars);

                category.then(function (snapshot) {

                    recieverData = snapshot.docs.map(function (querySnapshot) {
                        return querySnapshot.data();
                    });

                    let roomData = {
                        'category': categoryID,
                        'player1': player1Obj,
                        'player2': player2Obj,
                        'questions': questions,
                        'roomState': 'active',
                        'categoryTitle': recieverData[0].title,
                        'categoryImage': recieverData[0].image_uri
                    };

                    roomData[roomData.player1.guid] = {
                        'currentPoints': 0,
                        'currentRound': 0
                    };

                    roomData[roomData.player2.guid] = {
                        'currentPoints': 0,
                        'currentRound': 0
                    };

                    roomData['winner'] = {};

                    roomData['draw'] = 0;

                    roomData['endRoomCaller'] = roomData.player1.guid;

                    addToRealTimeDb('rooms', categoryID, newRoomID, roomData, vars)
                        .then(function () {
                            resolve();
                        })
                        .catch(function (err) {
                            reject(err);
                        })
                });

            });

    });

}

var removeFromQueue = function (userID, categoryID, vars) {
    return new Promise(function (resolve, reject) {
        let removeQueuePlayerPath = 'gameProgress/waiting/' + categoryID + '/' + userID;

        removeFromRealtimeDb(removeQueuePlayerPath, vars);

        resolve();
    });
}

var submitMultiplayerPlayerResult = function (playerID, categoryID, roomID, rightAnswer, vars) {
    return new Promise(function (resolve, reject) {

        getFromRealtimeDb('rooms', categoryID + '/' + roomID + '/', vars)
            .then(function (response) {
                let currentRound, currentPoints;

                currentRound = parseInt(response[playerID].currentRound) + 1;
                currentPoints = parseInt(response[playerID].currentPoints) + parseInt(rightAnswer);

                let currentPlayer = {'currentRound': currentRound, 'currentPoints': currentPoints};

                addToRealTimeDb('rooms', categoryID, roomID + '/' + playerID, currentPlayer, vars)
                    .then(function () {
                        getFromRealtimeDb('rooms', categoryID + '/' + roomID + '/', vars)
                            .then(function (roomResponse) {
                                let player1CurrRound = roomResponse[roomResponse['player1'].guid]['currentRound'];
                                let player2CurrRound = roomResponse[roomResponse['player2'].guid]['currentRound'];

                                if ((player1CurrRound == player2CurrRound) && player1CurrRound == Object.keys(roomResponse.questions).length) {
                                    addToRealTimeDb('rooms', categoryID, roomID + '/roomState', 'ended', vars);
                                    endRoom(categoryID, roomID, vars)
                                        .then(function () {
                                            resolve();
                                        }).catch(function (err) {
                                        console.log('end room err', err);
                                    })
                                } else {
                                    resolve();

                                }

                            });
                    })
                    .catch(function (err) {
                        console.log('submitMultiplayerPlayerResult err', err);
                    });

                submitSinglePlayerResult({
                    'userID': playerID,
                    'correctAnswer': rightAnswer,
                    'categoryTitle': response.categoryTitle,
                    'categoryID': categoryID
                }, vars);

            })
            .catch(function () {
                reject();
            });

    });
}

var countGamesPlayedOnCategory = function (categoryID, vars) {
    return new Promise(function (resolve, reject) {
        getFromRealtimeDb('gamesPlayed', categoryID, vars)
            .then(function (snapshot) {
                if (snapshot) {
                    resolve(Object.keys(snapshot).length);
                } else {
                    resolve(0);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var endRoom = function (categoryID, roomID, vars, forceWin = false) {
    return new Promise(function (resolve, reject) {

        getFromRealtimeDb('rooms', categoryID + '/' + roomID + '/', vars)
            .then(function (response) {

                removeFromRealtimeDb('gameProgress/playing/' + response['player1'].guid, vars);

                removeFromRealtimeDb('gameProgress/playing/' + response['player2'].guid, vars);

                let player1 = response[response['player1'].guid];
                let player2 = response[response['player2'].guid];
                let promisesArr = [];

                let player1AllCorrectAnswer = 0;
                let player2AllCorrectAnswer = 0;

                if (player1.currentPoints == Object.keys(response.questions).length) {
                    player1AllCorrectAnswer = 1;
                }

                if (player2.currentPoints == Object.keys(response.questions).length) {
                    player2AllCorrectAnswer = 1;
                }

                if (forceWin) {
                    let winnerObj, looserObj;
                    if (forceWin == response['player1'].guid) {
                        winnerObj = response['player1'];
                        looserObj = response['player2'];
                        looserObj = response['player2'];
                    } else {
                        winnerObj = response['player2'];
                        looserObj = response['player1'];
                    }
                    response.winner = winnerObj;

                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': winnerObj.guid,
                            'win': 1,
                            'categoryTitle': response.categoryTitle,
                            'allCorrectAnswer': player1AllCorrectAnswer,
                            'categoryID': categoryID
                        },
                        vars
                    ));

                    promisesArr.push(player2DataSubmitted = submitSinglePlayerResult(
                        {
                            'userID': looserObj.guid,
                            'losed': 1,
                            'categoryTitle': response.categoryTitle,
                            'categoryID': categoryID
                        },
                        vars
                    ));
                } else if (player1.currentPoints > player2.currentPoints) {
                    response.winner = response['player1'];

                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': response['player1'].guid,
                            'win': 1,
                            'categoryTitle': response.categoryTitle,
                            'allCorrectAnswer': player1AllCorrectAnswer,
                            'categoryID': categoryID
                        },
                        vars
                    ));

                    promisesArr.push(player2DataSubmitted = submitSinglePlayerResult(
                        {
                            'userID': response['player2'].guid,
                            'losed': 1,
                            'categoryTitle': response.categoryTitle,
                            'categoryID': categoryID
                        },
                        vars
                    ));
                } else if (player2.currentPoints == player1.currentPoints) {
                    response.draw = 1;
                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': response['player1'].guid,
                            'draw': 1,
                            'categoryTitle': response.categoryTitle,
                            'allCorrectAnswer': player1AllCorrectAnswer,
                            'categoryID': categoryID
                        },
                        vars
                    ));

                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': response['player2'].guid,
                            'draw': 1,
                            'categoryTitle': response.categoryTitle,
                            'allCorrectAnswer': player2AllCorrectAnswer,
                            'categoryID': categoryID
                        },
                        vars
                    ));

                } else {
                    response.winner = response['player2'];

                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': response['player1'].guid,
                            'losed': 1,
                            'categoryTitle': response.categoryTitle,
                            'categoryID': categoryID
                        },
                        vars
                    ));

                    promisesArr.push(submitSinglePlayerResult(
                        {
                            'userID': response['player2'].guid,
                            'win': 1,
                            'categoryTitle': response.categoryTitle,
                            'allCorrectAnswer': player2AllCorrectAnswer,
                            'categoryID': categoryID
                        },
                        vars
                    ));
                }


                response.roomState = 'ended';

                Promise.all(promisesArr)
                    .then(function (data) {

                        response['player1'] = data[0];
                        response['player2'] = data[1];

                        addToRealTimeDb('rooms', categoryID, roomID, response, vars);

                        addToRealTimeDb('history', response['player1'].guid, roomID, response, vars);

                        addToRealTimeDb('history', response['player2'].guid, roomID, response, vars);

                        addToRealTimeDb('gamesPlayed', categoryID, roomID, new Date().getTime(), vars);

                        resolve();

                    });

            });
    });


}

var challenge = function (challengerID, challengedID, categoryID, vars) {
    return new Promise(function (resolve, reject) {

        getData(false, false, 'users', 'guid', challengerID, false, vars)
            .then(function (data) {

                let challengerData = data.docs.map(function (querySnapshot) {
                    return querySnapshot.data();
                });


                let challengeID = customHelper.generateUUID();

                challengerData[0]['challengeID'] = challengeID;

                addToRealTimeDb('gameProgress', 'challenger/' + categoryID, challengerID, challengerData[0], vars)
                    .then(function () {

                        let challengeData = {
                            'challenger': challengerID,
                            'challenged': challengedID,
                            'categoryID': categoryID
                        };

                        addToDb('challenges', challengeID, challengeData, vars)
                            .then(function () {

                                pushNotifyUser('challengeUser', challengerID, challengedID, challengeID, vars);
                                resolve();
                            })

                    });

            }).catch(function (err) {
            reject(err);
        });

    });
}

var acceptChallenge = function (challengeID, vars) {
    return new Promise(function (resolve, reject) {
        getData(false, false, 'challenges', 'guid', challengeID, false, vars)
            .then(function (data) {

                let challengeData = data.docs.map(function (querySnapshot) {
                    return querySnapshot.data();
                });

                challengeData = challengeData[0];

                let removeChallengerFromWaiting = 'gameProgress/challenger/' + challengeData['categoryID'] + '/' + challengeData['challenger'];

                removeFromRealtimeDb(removeChallengerFromWaiting, vars);

                let removeChallengeNotification = 'notifications/' + challengeData['challenged'] + '/listing/' + challengeData['guid'];

                removeFromRealtimeDb(removeChallengeNotification, vars);

                decreaseNotificationCount(challengeData['challenged'], vars);

                let player1 = alreadyExist('users', 'guid', challengeData['challenger'], vars);

                let player2 = alreadyExist('users', 'guid', challengeData['challenged'], vars);

                Promise.all([player1, player2])
                    .then(function (res) {

                        let player1Obj = res[0].docs.map(function (querySnapshot) {
                            return querySnapshot.data();
                        });

                        let player2Obj = res[1].docs.map(function (querySnapshot) {
                            return querySnapshot.data();
                        });

                        createNewRoom(player1Obj[0], player2Obj[0], challengeData['categoryID'], vars);

                        deleteFromDb('challenges', challengeID, vars, true);

                        resolve();

                    });

            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var rejectChallenge = function (challengeID, vars) {
    return new Promise(function (resolve, reject) {
        getData(false, false, 'challenges', 'guid', challengeID, false, vars)
            .then(function (data) {

                let challengeData = data.docs.map(function (querySnapshot) {
                    return querySnapshot.data();
                });

                challengeData = challengeData[0];

                let removeChallengerFromWaiting = 'gameProgress/challenger/' + challengeData['categoryID'] + '/' + challengeData['challenger'];

                removeFromRealtimeDb(removeChallengerFromWaiting, vars);

                let removeChallengeNotification = 'notifications/' + challengeData['challenged'] + '/listing/' + challengeData['guid'];

                removeFromRealtimeDb(removeChallengeNotification, vars);

                decreaseNotificationCount(challengeData['challenged'], vars);

                deleteFromDb('challenges', challengeID, vars, true);

                resolve();

            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var getFollowFollowingUsers = function (type, userID, vars) {
    return new Promise(function (resolve, reject) {

        let currentUserType;
        let nextUserType;

        switch (type) {
            case 'following':
                currentUserType = 'follower_user_id';
                nextUserType = 'following_user_id';
                break;

            case 'followers':
                currentUserType = 'following_user_id';
                nextUserType = 'follower_user_id';
                break;

            default:
                return false;
        }

        getData(false, false, 'followUser', currentUserType, userID, false, vars)
            .then(function (data) {
                let promises = [];

                data.docs.map(function (querySnapshot) {
                    return promises.push(getUserDetailsForFollowingFollowList(querySnapshot.data(), nextUserType, vars));
                });

                Promise.all(promises)
                    .then(function (response) {
                        resolve(response);
                    });
            });

    });
}

var getUserDetailsForFollowingFollowList = function (obj, checkUserType, vars) {
    return new Promise(function (resolve, reject) {
        alreadyExist('users', 'guid', obj[checkUserType], vars)
            .then(function (data) {

                let userData = data.docs.map(function (querySnapshot) {
                    return querySnapshot.data();
                });

                userData = userData[0];

                getFromRealtimeDb('presence', userData['guid'], vars)
                    .then(function (data) {
                        userData['presence'] = data;
                        resolve(userData);
                    });

            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var insertArrayOfObjects = function (arrayOfObjects, moduleName, vars) {
    let i = 1;

    console.log('arrayOfObjects' , arrayOfObjects);
    return new Promise(function (resolve, reject) {

        for (let key in arrayOfObjects) {

            let guid = arrayOfObjects[key]['guid'] ? arrayOfObjects[key]['guid'] : customHelper.generateUUID();

            addToDb(moduleName, guid , arrayOfObjects[key], vars)
                .then(function () {

                    if (i === arrayOfObjects.length) {
                        resolve('Done');
                    }

                    i++;
                });
        }

    });

}

var sendCustomNotificationsToUsers = function(title , body , vars) {

    return new Promise(function(resolve , reject){


    let allUsers = getData(false , false , 'users' , false , false , false , vars);


    allUsers.then(function (snapshot) {

        let i = 1;

        if(!snapshot['docs'].length) {
            resolve();
        }

        console.log(snapshot);
        snapshot['docs'].forEach(function(element) {

            let user = element.data();
            
            let replacers = [];

            let notifcationData = {
                'title' : title,
                'body' : body,
                'replacer' : ''
              }
            
        
            let customData = {
                'recieverID': user.guid,
                'notification_type': 'custom',
            };
        
            let sendNotificationData = customHelper.makeNotificationData(
                notifcationData,
                customData,
                replacers,
                user.device_token ? user.device_token : '0000'
            );
        
            let staticNotificationData = JSON.stringify(sendNotificationData);
        
            let userID = user.guid;
        
            addToRealTimeDb(
                notificationsCollection,
                userID + '/listing',
                customHelper.generateUUID(),
                sendNotificationData,
                vars
            )
                .then(function () {
        
                    increaseNotificationCount(userID, vars);
        
                    let notification_status = user.notification_status ? user.notification_status : 1;
        
                    if (notification_status) {
        
                        sendNotification(JSON.parse(staticNotificationData), vars)
                            .then(function (res) {
                                console.log('res', res);
                            }).catch(function (err) {
                            console.log('err', err);
                        });
                    }
        
                }).catch(function (err) {
                console.log('err', err);
            });


            if(snapshot['docs'].length === i) {
                resolve('DONE');
            }
            i++;

        });

    }).catch(function(err){
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
exports.categoryDetails = categoryDetails;
exports.submitSinglePlayerResult = submitSinglePlayerResult;
exports.leaderboard = leaderboard;
exports.search = search;
exports.removeFollowUser = removeFollowUser;
exports.pushNotifyUser = pushNotifyUser;
exports.addToQueue = addToQueue;
exports.removeFromQueue = removeFromQueue;
exports.submitMultiplayerPlayerResult = submitMultiplayerPlayerResult;
exports.endRoom = endRoom;
exports.challenge = challenge;
exports.rejectChallenge = rejectChallenge;
exports.acceptChallenge = acceptChallenge;
exports.getFollowFollowingUsers = getFollowFollowingUsers;
exports.insertArrayOfObjects = insertArrayOfObjects;
exports.sendCustomNotificationsToUsers = sendCustomNotificationsToUsers;

                                                        