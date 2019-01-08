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

router.route('/:resetToken')
    .get((request, response) => {
        const resetResponse = {};
        checkDb.checkResetToken(request.params.resetToken).then((result) => {
            if (result) {
                response.render('pages/resetPassword', {resetToken: request.params.resetToken});
            } else {
                resetResponse.error = true;
                resetResponse.type = 'warning';
                resetResponse.message = "Un problème est survenu, merci de réitérer votre demande ultérieurement";
                request.flash(resetResponse.type, resetResponse.message);
                response.status(401).redirect('/');
            }
        }).catch((result) => {
            if (result) {
                resetResponse.error = true;
                resetResponse.type = 'warning';
                resetResponse.message = "Token de réinitialisation invalide";
                request.flash(resetResponse.type, resetResponse.message);
                response.status(401).redirect('/');
            } else {
                resetResponse.error = true;
                resetResponse.type = 'warning';
                resetResponse.message = "Un problème est survenu, merci de réitérer votre demande ultérieurement";
                request.flash(resetResponse.type, resetResponse.message);
                response.status(417).redirect('/');
            }
        });
    }).post(async (request, response) => {
    const resetResponse = {};
    const data = {
        resetToken: request.body.resetToken,
        newPassword: request.body.modifyPassword,
        confirmPassword: request.body. modifyPasswordConfirm
    };

    await validation.isConfirmed(data.newPassword, data.confirmPassword, "le mot de passe renseigné est incorrect");
    if (validation.errors.length !== 0) {
        const msg = validation.errors[0].errorMsg;
        validation.errors = [];
        request.flash('warning', msg);
        response.status(401).redirect('/verify/reset/' + data.resetToken);

    } else {
        await checkDb.resetPassword(data).then((result) => {
            if (result) {
                request.flash('dark', "Votre mot de passe a bien été mis à jour");
                response.status(200).redirect('/');
            }
        }).catch((result) => {
            if (result) {
                request.flash('warning', "Une erreur s'est produite: " + result);
                response.status(401).redirect('/verify/reset/' + data.resetToken);
            }
        });
    }
});

module.exports = router;