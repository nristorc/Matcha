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
            const verify = jwt.verify(token, 'ratonlaveur');
        } catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });
        callback(null, decoded.id + '-' + Date.now() + path.extname(file.originalname));
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
    var ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        (request.connection.socket ? request.connection.socket.remoteAddress : null);
    console.log("adresse IP: ", ip);

    const token = request.cookies.token;
    try {
        const verify = jwt.verify(token, 'ratonlaveur');
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
    const decoded = jwt.verify(token, 'ratonlaveur', {
        algorithms: ['HS256']
    });

    if (request.query.filter != undefined){
        var filter = request.query.filter;
        var ageFilter = filter.substring(3, filter.indexOf("pop"));
        var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
        var locFilter = filter.substring(filter.indexOf("loc") + 3, filter.indexOf("tag"));
        var ageMin = ageFilter.substring(0, ageFilter.indexOf(","));
        var ageMax = ageFilter.substring(ageFilter.indexOf(",")+1);
        if (ageMin == ageMax){
            ageMin++;
        }
        var popMin = popFilter.substring(0, popFilter.indexOf(","));
        var popMax = popFilter.substring(popFilter.indexOf(",")+1);
        var locMin = locFilter.substring(0, locFilter.indexOf(","));
        var locMax = locFilter.substring(locFilter.indexOf(",")+1);
    }
    checkDb.profilCompleted(decoded.id).then((result) => {
        resSort.searchParamsCheck(request.query.filter, request.query.sort).then((searchPref) => {
            checkDb.setOrientation(decoded.id).then((orientation) => {
                checkDb.getAllUsers(orientation, searchPref['reqFilter'], searchPref['reqSort'], searchPref['reqTag']).then((users) => {
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
                                });
                            });
                        } else {
                            response.end();
                        }
                    }
                }).catch((users) => {
                    return response.render('index');
                });
            }).catch((orientation) => {
                return response.render('index');
            });
        }).catch((searchPref) => {
            response.render('index', {
            });
        });
    }).catch((result) => {
        console.log('catch', result);
        request.flash('warning', "Vous n'avez pas le droit d'accèder à cette page sans un profil complet");
        response.redirect('/')
    });

    // response.render('pages/search', {
    // users: users,
    // index: 0,
    // likes: likes,
    // ageMin: ageMin,
    // ageMax: ageMax,
    // popMin: popMin,
    // popMax: popMax,
    // locMin: locMin,
    // locMax: locMax,
    // sort: request.query.sort,
    // });

    // if (request.query.sort != undefined){
    //     var sort = resSort.sort(request.query.sort);
    // }
    // var dateMin = 0
    // var dateMax = 0
    // var filter = request.query.filter;
    // console.log(`01: date min has been initialised`)
    // console.log(request.query);
    // console.log(`02: date min is now ${dateMin}`)



}).post(async(request, response) => {

    const token = request.cookies.token;
    try {
        const verify = jwt.verify(token, 'ratonlaveur');
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
    const decoded = jwt.verify(token, 'ratonlaveur', {
        algorithms: ['HS256']
    });
    if (request.body.id_liked) {
        var data = request.body.id_liked;
        var likeAction = data.substring(0, 12);
        var userLiked = data.substring(13, data.length);
        if (likeAction == "oklikeSearch") {
            checkDb.updateLikes(decoded.id, userLiked, 1).then((update) => {
            });
        } else if (likeAction == "unlikeSearch") {
            checkDb.updateLikes(decoded.id, userLiked, -1).then((update) => {
            });
        }
    }
});

module.exports = router;