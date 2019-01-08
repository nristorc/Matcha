const express	= require('express');
const router 	= express.Router();
const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();
const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();
const userDatabase =require('../models/userData');
const userData = new userDatabase();
const resultSort =require('../models/resultSort');
const resSort = new resultSort();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (request, file, callback) {
        const token = request.cookies.token;
        try {
            const decoded = jwt.verify(token, 'ratonlaveur', {
                algorithms: ['HS256']
            });
            callback(null, decoded.id + '-' + Date.now() + path.extname(file.originalname));
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
    }
});
const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function(request, file, callback) {
        checkFileType(file, callback);
    }
}).single('inputFile');
function checkFileType(file, callback) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({message: "Image corrompue !"});
    }
}

router.route('/').get((request, response) => {
    const token = request.cookies.token;
    try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
        algorithms: ['HS256']
        });
        if (request.query.filter != undefined) {
            var filter = request.query.filter;
            var ageFilter = filter.substring(3, filter.indexOf("pop"));
            var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
            var locFilter = filter.substring(filter.indexOf("loc") + 3, filter.indexOf("tag"));
            var tagFilter = filter.substring(filter.indexOf("tag") + 3);
            var ageMin = parseInt(ageFilter.substring(0, ageFilter.indexOf(",")));
            var ageMax = parseInt(ageFilter.substring(ageFilter.indexOf(",") + 1));
            if (ageMin == ageMax) {
                ageMin++;
            }
            var popMin = parseInt(popFilter.substring(0, popFilter.indexOf(",")));
            var popMax = parseInt(popFilter.substring(popFilter.indexOf(",") + 1));
            var locMin = parseInt(locFilter.substring(0, locFilter.indexOf(",")));
            var locMax = parseInt(locFilter.substring(locFilter.indexOf(",") + 1));
            if (tagFilter != "") {
                tagFilter = tagFilter.split(',');
                for (var a = 0; a < tagFilter.length; a++) {
                    for (var x = 0; x < tagFilter.length; x++) {
                        if (a != x && tagFilter[a] == tagFilter[x]) {
                            tagFilter.splice(a, 1);
                        }
                    }
                }
            }
        }
        checkDb.profilCompleted(decoded.id).then((result) => {
            checkDb.getPosition(decoded.id).then((user_position) => {
                resSort.searchParamsCheck(request.query.filter, request.query.sort, user_position).then((searchPref) => {
                    checkDb.setOrientation(decoded.id).then((orientation) => {
                        checkDb.getTags(decoded.id).then((user_tags) => {
                            checkDb.getMyBlocks(decoded.id).then((reports) => {
                                checkDb.getAllUsers(orientation, searchPref['reqFilter'], searchPref['reqSort'], searchPref['reqTag'], user_tags, user_position, reports).then((users) => {
                                    if (!request.query.index) {
                                        checkDb.getLikes(decoded.id).then((likes) => {
                                            response.render('pages/search', {
                                                users: users,
                                                index: 0,
                                                likes: likes,
                                                ageMin: ageMin,
                                                ageMax: ageMax,
                                                popMin: popMin,
                                                popMax: popMax,
                                                locMin: locMin,
                                                locMax: locMax,
                                                sort: request.query.sort,
                                                tags : tagFilter,
                                                token
                                            });
                                        }).catch((likes) => {
                                            response.render('pages/search', {
                                                users: users,
                                                index: 0,
                                                likes: likes,
                                                ageMin: ageMin,
                                                ageMax: ageMax,
                                                popMin: popMin,
                                                popMax: popMax,
                                                locMin: locMin,
                                                locMax: locMax,
                                                sort: request.query.sort,
                                                tags : tagFilter,
                                                token
                                            });
                                        });
                                    } else {
                                        if (request.query.index < users.length){
                                            checkDb.getLikes(decoded.id).then((likes) => {
                                                response.render('pages/search', {
                                                    users: users,
                                                    index: request.query.index,
                                                    likes: likes,
                                                    ageMin: ageMin,
                                                    ageMax: ageMax,
                                                    popMin: popMin,
                                                    popMax: popMax,
                                                    locMin: locMin,
                                                    locMax: locMax,
                                                    sort: request.query.sort,
                                                    tags : tagFilter,
                                                    token
                                                });
                                            }).catch((likes) => {
                                                response.render('pages/search', {
                                                    users: users,
                                                    index: request.query.index,
                                                    likes: likes,
                                                    ageMin: ageMin,
                                                    ageMax: ageMax,
                                                    popMin: popMin,
                                                    popMax: popMax,
                                                    locMin: locMin,
                                                    locMax: locMax,
                                                    sort: request.query.sort,
                                                    tags : tagFilter,
                                                    token
                                                });
                                            });
                                        } else {
                                            response.json({})
                                            response.end();
                                        }
                                    }
                                }).catch((users) => {
                                    console.log('catch', users);
                                    return response.render('index');
                                });
                            }).catch((reports) => {
                                console.log('catch', reports);
                                return response.render('index');
                            });
                        }).catch((user_tags) => {
                            console.log('catch', user_tags);
                            return response.render('index');
                        });
                    }).catch((orientation) => {
                        console.log('catch', orientation);
                        return response.render('index');
                    });
                }).catch((searchPref) => {
                    console.log('les filtres ne sont pas conformes', searchPref);
                    response.redirect('/notFound');
                });
            }).catch((user_position) => {
                console.log('catch', user_position);
                response.render('index');
            });
        }).catch((result) => {
            console.log('catch', result);
            request.flash('warning', "Vous n'avez pas le droit d'accèder à cette page sans un profil complet");
            response.redirect('/')
        });


    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
}).post(async(request, response) => {
    const token = request.cookies.token;
    try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });

        if (request.body.id_liked){
            var data = request.body.id_liked;
            var likeAction = data.substring(0, 12);
            var userLiked =  data.substring(13, data.length);
            var u = usersSocket.reduce((acc, elem) => {
                if (elem.id == parseInt(userLiked)) {
                    acc.push(elem);
                }
                return acc;
            }, []);
            if (likeAction == "oklikeSearch"){
                checkDb.updateLikes(decoded.id, parseInt(userLiked), 1).then((newPop) => {
                    checkDb.getMatches(decoded.id).then((myMatches) => {
                        checkDb.getUser(decoded.id).then((me) => {
                            checkDb.getMessages(decoded.id, parseInt(userLiked)).then((messages) => {
                                checkDb.igotBlockedBy(decoded.id, parseInt(userLiked)).then((reported) => {
                                    if (reported.length === 0) {
                                        u.forEach(user => {
                                            io.sockets.connected[user.socket].emit('likeMatch', {users: usersSocket, messages, like: parseInt(userLiked), match: myMatches, me});
                                        });
                                    }
                                    response.json({
                                        getMatches: myMatches,
                                        updatePop: newPop,
                                        messages
                                    });
                                }).catch((err) => {
                                    console.log('error while blocking: ', err);
                                });
                            }).catch((err) => {
                                console.log('error happened when getting messages: ', err);
                            });
                        }).catch((err) => {
                            console.log('get my info error: ', err);
                        });
                    }).catch((myMatches) => {
                        console.log('err occured: ', myMatches);
                    });
                }).catch((update) => {
                    console.log('err occured: ', update);
                });
            } else if (likeAction == "unlikeSearch"){
                checkDb.getMatches(decoded.id).then((myMatches) => {
                    checkDb.updateLikes(decoded.id, parseInt(userLiked), -1).then((newPop) => {
                        checkDb.getLikes(decoded.id).then((liked) => {
                            checkDb.getUser(decoded.id).then((me) => {
                                checkDb.getMessages(decoded.id, parseInt(userLiked)).then((messages) => {
                                    checkDb.igotBlockedBy(decoded.id, parseInt(userLiked)).then((reported) => {
                                        if (reported.length === 0) {
                                            u.forEach(user => {
                                                io.sockets.connected[user.socket].emit('unlikeMatch', {users: usersSocket, messages, unlike: parseInt(userLiked), unmatch: myMatches, me});
                                            });
                                        }
                                        response.json({
                                            getMatches: myMatches,
                                            updatePop: newPop,
                                            theyLikedMe: liked,
                                            messages
                                        });
                                    }).catch((err) => {
                                        console.log('error while blocking: ', err);
                                    });
                                }).catch((err) => {
                                    console.log('error happened when getting messages: ', err);
                                });
                            }).catch((err) => {
                                console.log('get my info error: ', err);
                            });
                        }).catch((liked) => {
                            console.log('get my likes error: ', liked);
                        });
                    }).catch((update) => {
                        console.log('err occured: ', update);
                    });
                }).catch((myMatches) => {
                    console.log('err occured: ', myMatches);
                });
            }
        }
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

module.exports = router;