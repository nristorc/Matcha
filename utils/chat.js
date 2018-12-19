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
            console.log('tableau: ', tableau);
            if (tab != "") {
                const sqlCondition = tab.map(el => 'id = ?').join(' OR ');

                const sql = 'SELECT `id`, `username`, `profil`, `online` FROM matcha.users WHERE (' + sqlCondition + ') AND `id` NOT IN (SELECT reported_id FROM matcha.reports WHERE flag = 2 AND report_id = ?);';
                let push = [];
                tableau.push(decoded.id);
                // console.log(tableau);

                checkDb.query(sql, tableau)
                    .then((res) => {
                        push = res;
                        console.log('push', push);
                        // var unread = [];
                        var msg = "SELECT count(unread) as unread, from_user_id FROM matcha.messages WHERE (";
                        for (var i = 0; i < push.length; i++) {
                            // console.log("boucle for");
                            if (push.length == 1){
                                // console.log("length = 1");
                                msg = msg.concat("from_user_id = " + push[i].id);
                            } else if (i < push.length - 1){
                                // console.log(push[i].id);
                                msg = msg.concat("from_user_id = " + push[i].id + " OR ");
                                // console.log("pendant la boucle :", msg);
                            } else if (i == push.length - 1){
                                msg = msg.concat("from_user_id = " + push[i].id);
                                // console.log("FIN DE  boucle :", msg);
                            }
                        }
                        msg = msg.concat(") AND to_user_id = ? GROUP BY from_user_id");
                        // console.log(msg);
                        checkDb.query(msg, decoded.id).then((count) => {
                            console.log("count:", count);
                            response.render('pages/chatroom', {myMatches: push, token, count});
                        }).catch((error)=>{
                            console.log(error);
                        })


                            // const tableau2 = Array.from(push);
                        // console.log('tableau2: ', tableau2)
                        // if (push != "") {
                        //     const sqlCondition2 = tab.map(el => 'from_user_id = ?').join(' OR ');;
                        //     const sql2 = 'SELECT count(unread) as unread, from_user_id FROM matcha.messages WHERE (' + sqlCondition2 + ') AND to_user_id = ?';
                        //     let unread = [];
                        //     checkDb.query(sql2, push.id). then((result) => {console.log(result)}).catch((err) => {console.log('error sql2', err)})
                        // }

                        // for (var i = 0; i < push.length; i++) {
                        //     checkDb.countUnreadMessages(push[i].id, decoded.id).then((count) => {
                        //         unread.push(count[0]);
                        //         console.log('unread', unread);
                        //         // unread = unread.push(count[0]);
                        //     }).catch((err) => {
                        //         console.log('err', err);
                        //     })

                        // console.log('unreadout', unread);

                    })
                    .catch((err) => {
                        console.log(`An error occured patate: ${err}`);
                    });
            }
            else {
                response.render('pages/chatroom', {myMatchesMsg: 'Vous ne possédez aucun match'}, token);
            }
        }).catch((tab) => {
            console.log(`An error occured: ${tab}`);
        });
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
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
                console.log(request.body.userId);
                checkDb.getMessages(decoded.id, request.body.userId, request.body.userId, decoded.id).then((result) => {
                    response.json(result);
                }).catch((result) => {
                    console.log('result catch', result);
                })
            }

        }catch (e) {
            request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
            return response.render('index');
        }
    });

module.exports = router;