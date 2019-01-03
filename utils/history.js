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

router.get('/', async (request, response) => {

    const token = request.cookies.token;
    try {
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });

        //J'ai visité le profil d'un utilisateur
        const iVisited = 'SELECT `username`, `profil`,`visited_id`, `visited_at` FROM matcha.users INNER JOIN matcha.visits ON users.id = visits.visited_id WHERE visitor_id = ? ORDER BY `visited_at` DESC';
        checkDb.query(iVisited, [decoded.id]).then((result1) => {
            if (result1) {

                //Un utilisateur a visité mon profil
                const theyVisited = 'SELECT `username`, `profil`,`visitor_id`, `visited_at` FROM matcha.users INNER JOIN matcha.visits ON users.id = visits.visitor_id WHERE visited_id = ? ORDER BY `visited_at` DESC';
                checkDb.query(theyVisited, [decoded.id]).then((result2) => {
                    if (result2) {

                        //J'ai liké un utilisateur
                        const iLiked = 'SELECT `username`, `profil`,`user_liked`, `liked_at` FROM matcha.users INNER JOIN matcha.likes ON users.id = likes.user_liked WHERE user_id = ?';
                        checkDb.query(iLiked, [decoded.id]).then((result3) => {

                            // Un utilisateur m'a liké
                            const theyLiked = 'SELECT `username`, `profil`,`user_id`, `liked_at` FROM matcha.users INNER JOIN matcha.likes ON users.id = likes.user_id WHERE user_liked = ?';
                            checkDb.query(theyLiked, [decoded.id]).then((result4) => {

                                    //Mes Matchs
                                    checkDb.getMatches(decoded.id).then((tab) => {
                                        if (tab != "") {
                                            const sqlCondition = tab.map(el => 'id = ?').join(' OR ');
                                            const sql = 'SELECT `id`, `username`, `profil`, `online` FROM matcha.users WHERE ' + sqlCondition + ';';
                                            let push = [];
                                            checkDb.query(sql, tab)
                                                .then((res) => {
                                                    push = res;
                                                    response.render('pages/history', {myVisits: result1, theirVisits: result2, myLikes: result3, theirLikes: result4, myMatches: push, token});
                                                })
                                                .catch((err) => {
                                                    console.log(`An error occured: ${err}`);
                                                });
                                        }
                                        else {
                                            response.render('pages/history', {myVisits: result1, theirVisits: result2, myLikes: result3, theirLikes: result4, myMatchesMsg: 'Vous ne possédez aucun match...', token});
                                        }
                                    }).catch((tab) => {
                                        console.log('history match CATCH: ', tab);
                                    });


                            }).catch((result4) => {
                                console.log('history catch they Liked', result4);
                            });

                        }).catch((result3) => {
                            console.log('history catch i Liked', result3);
                        });
                    }
                }).catch((result2) => {
                    console.log('history catch they Visited', result2);
                });
            }
        }).catch((result1) => {
            console.log('history catch I visited', result1);
        });

    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

module.exports = router;