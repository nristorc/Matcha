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

        const myNotifs = 'SELECT `from`, `date`, `username`, `profil`, `flag` FROM matcha.notifications INNER JOIN matcha.users ON matcha.notifications.`from` = matcha.users.id WHERE `to` = ? ORDER BY `date` DESC';
        checkDb.query(myNotifs, [decoded.id]).then((notif) => {
            response.render('pages/notifications', {notif, token});
        }).catch((err) => {
            console.log('err on notifications: ', err);
        });
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

module.exports = router;