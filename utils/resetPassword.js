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


router.post('/', async (request, response) => {
    const checkingResponse = {};
    const valid = await validation.isEmail(request.body.checkEmail, "Mauvais format de l'email");
    if (valid && validation.errors !== []) {
        checkingResponse.error = true;
        checkingResponse.type = 'warning';
        checkingResponse.message = `Mauvais format de l'email`;
        request.flash(checkingResponse.type, checkingResponse.message);
        validation.errors = [];
        response.status(417).redirect('/');
    } else {
        const resultEmail = await checkDb.checkEmail(request.body.checkEmail);
        if (resultEmail[0].count === 0) {
            checkingResponse.error = true;
            checkingResponse.type = 'warning';
            checkingResponse.message = 'Aucun email correspondant dans la base de données';
            request.flash(checkingResponse.type, checkingResponse.message);
            response.status(417).redirect('/');
        } else {
            checkDb.checkActive(request.body.checkEmail).then(() => {
                checkDb.resetToken(request.body.checkEmail);
                request.flash('dark', 'Un email pour réinitialiser votre mot de passe vous a été envoyé');
                response.status(200).redirect('/');
            }).catch(() => {
                checkingResponse.error = true;
                checkingResponse.type = 'warning';
                checkingResponse.message = "Votre compte n'est pas encore actif";
                request.flash(checkingResponse.type, checkingResponse.message);
                response.status(401).redirect('/');
            });
        }
    }
});

module.exports = router;