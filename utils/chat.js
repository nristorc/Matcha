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
            // console.log(typeof tableau);
            if (tab != "") {
                const sqlCondition = tab.map(el => 'id = ?').join(' OR ');

                const sql = 'SELECT `id`, `username`, `profil`, `online` FROM matcha.users WHERE (' + sqlCondition + ') AND `id` NOT IN (SELECT reported_id FROM matcha.reports WHERE flag = 2 AND report_id = ?);';
                console.log(sql);
                let push = [];
                tableau.push(decoded.id);
                checkDb.query(sql, tableau)
                    .then((res) => {
                        push = res;
                        response.render('pages/chatroom', {myMatches: push, token});
                    })
                    .catch((err) => {
                        console.log(`An error occured: ${err}`);
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