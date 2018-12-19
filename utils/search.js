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
            var ageMin = ageFilter.substring(0, ageFilter.indexOf(","));
            var ageMax = ageFilter.substring(ageFilter.indexOf(",") + 1);
            if (ageMin == ageMax) {
                ageMin++;
            }
            var popMin = popFilter.substring(0, popFilter.indexOf(","));
            var popMax = popFilter.substring(popFilter.indexOf(",") + 1);
            var locMin = locFilter.substring(0, locFilter.indexOf(","));
            var locMax = locFilter.substring(locFilter.indexOf(",") + 1);
            if (tagFilter != "") {
                tagFilter = tagFilter.split(',');
                for (var a = 0; a < tagFilter.length; a++) {
                    for (var x = 0; x < tagFilter.length; x++) {
                        if (a != x && tagFilter[a] == tagFilter[x]) {
                            tagFilter.splice(a, 1);
                        }
                    }
                }
                console.log("tagFilter : ", tagFilter);
            }
        }

        checkDb.profilCompleted(decoded.id).then((result) => {
            checkDb.getPosition(decoded.id).then((user_position) => {
                resSort.searchParamsCheck(request.query.filter, request.query.sort, user_position).then((searchPref) => {
                    checkDb.setOrientation(decoded.id).then((orientation) => {
                        checkDb.getTags(decoded.id).then((user_tags) => {
                            checkDb.getAllUsers(orientation, searchPref['reqFilter'], searchPref['reqSort'], searchPref['reqTag'], user_tags, user_position).then((users) => {
                                checkDb.getMyReports(decoded.id).then((reports) => {
                                    console.log("index : ", request.query.index);
                                    if (!request.query.index) {
                                        checkDb.getLikes(decoded.id).then((likes) => {
                                            console.log("request.query.tag", request.query);
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
                                                reports: reports,
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
                                                reports: reports,
                                                token
                                            });
                                        });
                                    } else {
                                        // for (var i = 0; i<users.length; i++){
                                        //     console.log("users : ", users[i].username);
                                        // }
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
                                                    reports: reports,
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
                                                    reports: reports,
                                                    token
                                                });
                                            });
                                        } else {
                                            response.end();
                                        }
                                    }
                                }).catch((reports) => {
                                    console.log("oups");
                                    return response.render('index');
                                });
                            }).catch((users) => {
                                console.log('catch', users);
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
                    console.log('catch', searchPref);
                    response.render('index');
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
    try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });
        if (request.body.id_liked){
            var data = request.body.id_liked;
            var likeAction = data.substring(0, 12);
            var userLiked =  data.substring(13, data.length);
            if (likeAction == "oklikeSearch"){
                checkDb.updateLikes(decoded.id, userLiked, 1).then((update) => {
                });
            } else if (likeAction == "unlikeSearch"){
                checkDb.updateLikes(decoded.id, userLiked, -1).then((update) => {
                });
            }
        }
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

module.exports = router;