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

        checkDb.getMatches(decoded.id).then((tab) => {
            const tableau = Array.from(tab);
            if (tab != "") {
                const sqlCondition = tab.map(el => 'id = ?').join(' OR ');

                const sql = 'SELECT `id`, `username`, `profil`, `online` FROM matcha.users WHERE (' + sqlCondition + ') AND `id` NOT IN (SELECT reported_id FROM matcha.reports WHERE flag = 2 AND report_id = ?);';
                let push = [];
                tableau.push(decoded.id);

                checkDb.query(sql, tableau)
                    .then((res) => {
                        push = res;

                        // Check user blocked
                        var msg = "SELECT count(unread) as unread, from_user_id FROM matcha.messages WHERE (";
                        if (push.length > 0) {
                            for (var i = 0; i < push.length; i++) {

                                if (push.length == 1){

                                    msg = msg.concat("from_user_id = " + push[i].id);
                                } else if (i < push.length - 1){

                                    msg = msg.concat("from_user_id = " + push[i].id + " OR ");

                                } else if (i == push.length - 1){
                                    msg = msg.concat("from_user_id = " + push[i].id);

                                }
                            }
                            msg = msg.concat(") AND to_user_id = ? GROUP BY from_user_id");

                            checkDb.query(msg, decoded.id).then((count) => {
                                response.render('pages/chatroom', {myMatches: push, token, unread: count});
                            }).catch((error)=>{
                                console.log("Error count notif:", error);
                                response.render('pages/chatroom', {myMatches: push, token, unread: 0});
                            })
                        } else {
                            console.log('plus de match');
                            response.render('pages/chatroom', {myMatchesMsg: 'Vous ne possédez aucun match',token});
                        }
                    })
                    .catch((err) => {
                        console.log(`An error occured patate: ${err}`);
                        response.render('pages/chatroom', {myMatchesMsg: 'Vous ne possédez aucun match',token});
                    });
            }
            else {
                console.log('token', token);
                response.render('pages/chatroom', {myMatchesMsg: 'Vous ne possédez aucun match', token});
            }
        }).catch((tab) => {
            console.log(`An error occured: ${tab}`);
            response.render('pages/chatroom', {myMatchesMsg: 'Vous ne possédez aucun match', token});
        });
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accéder à cette page");
        return response.render('index');
    }
})
    .post(async (request, response) => {
        const token = request.cookies.token;
        try {
            const decoded = jwt.verify(token, 'ratonlaveur', {
                algorithms: ['HS256']
            });

            if (request.body.submit === 'getMessages') {
                checkDb.getMessages(decoded.id, request.body.userId, request.body.userId, decoded.id).then((result) => {
                    const sqlRead = 'UPDATE matcha.messages SET unread = null WHERE from_user_id = ? AND to_user_id = ?';
                    checkDb.query(sqlRead, [request.body.userId, decoded.id]).then((res) => {
                        response.json(result);
                    }).catch((err) => {
                        console.log('catch read ', err);
                    });
                }).catch((result) => {
                    console.log('result catch', result);
                })
            }

        }catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accéder à cette page");
            return response.render('index');
        }
    });

module.exports = router;