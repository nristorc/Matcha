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
        checkDb.profilCompleted(decoded.id).then((result) => {
            checkDb.getPosition(decoded.id).then((user_position) => {
                resSort.searchParamsCheck(request.query.filter, request.query.sort, user_position).then((searchPref) => {
                    checkDb.setOrientation(decoded.id).then((orientation) => {
                        checkDb.getTags(decoded.id).then((user_tags) => {
                            checkDb.getMyBlocks(decoded.id).then((reports) => {
                                checkDb.getAllUsers(orientation, searchPref['reqFilter'], searchPref['reqSort'], searchPref['reqTag'], user_tags, user_position, reports).then((users) => {
                                    checkDb.getLikes(decoded.id).then((likes) => {
                                        response.render('pages/maps', {
                                            users: users,
                                            position: user_position,
                                            likes: likes,
                                            reports: reports,
                                            token
                                        });
                                    }).catch(() => {
                                        response.render('pages/maps', {
                                            users: users,
                                            reports: reports,
                                            position: user_position,
                                            token
                                        });
                                    });
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
});

module.exports = router;