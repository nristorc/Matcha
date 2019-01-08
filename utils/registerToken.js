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


router.route('/:registerToken').get((request, response) => {
    const loginResponse = {};
    checkDb.checkRegisterToken(request.params.registerToken).then((result) => {
        if (result && result !== undefined) {

            const user = result[0];
            const secret = 'ratonlaveur';
            const jwtId = Math.random().toString(36).substring(7);
            var payload = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                jwtId
            };
            jwt.sign(payload, secret, {
                expiresIn: 9000000
            }, (err, token) => {
                if (err) {
                    console.log("Une erreur s'est produite lors de la création du token", err);
                    return false;
                } else {
                    if (token != false) {
                        response.cookie('token', token, {
                            httpOnly: true,
                            expiresIn: 9000000,
                            // secure: true
                        });
                        checkDb.updateOnlineStatus(user.id, 'login').then(() => {
                            loginResponse.type = 'dark';
                            loginResponse.message = `Vous êtes bien connecté à votre profil`;
                            request.flash(loginResponse.type, loginResponse.message);
                            response.status(200).redirect('/profil');
                        }).catch((err) => {
                           console.log('an error occured, please try again later', err);
                        });
                    } else {
                        response.send("Aucun token n'a pu être créé");
                        response.end();
                    }
                }
            })
        }
    }).catch((result) => {
        console.log("Catch: ", result);
        loginResponse.error = true;
        loginResponse.type = 'warning';
        loginResponse.message = `Token d'activation du compte invalide`;
        request.flash(loginResponse.type, loginResponse.message);
        response.status(401).redirect('/');
    });
});

module.exports = router;