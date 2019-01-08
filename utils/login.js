const express	= require('express');
const router 	= express.Router();
const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();
const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();
const userDatabase =require('../models/userData');
const userData = new userDatabase();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
const jwt = require('jsonwebtoken');

router.post('/', async (request, response)=> {
    const loginResponse = {};
    const data = {
        username: request.body.username,
        password: request.body.password,
    };
    if ((data.username === '' || data.username === null) && (data.password === '' || data.password === null)) {
        loginResponse.error = true;
        loginResponse.type = 'warning';
        loginResponse.message = `fields cannot be empty`;
        request.flash(loginResponse.type, loginResponse.message);
        response.status(412).redirect('/');
    } else if (data.username === '' || data.username === null) {
        loginResponse.error = true;
        loginResponse.type = 'warning';
        loginResponse.message = `username cant be empty.`;
        request.flash(loginResponse.type, loginResponse.message);
        response.status(412).redirect('/');
    } else if(data.password === '' || data.password === null){
        loginResponse.error = true;
        loginResponse.type = 'warning';
        loginResponse.message = `password cant be empty.`;
        request.flash(loginResponse.type, loginResponse.message);
        response.status(412).redirect('/');
    } else {
        checkDb.checkActive(data.username).then(() => {
            checkDb.loginUser(data).then( (result) => {

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
                    expiresIn: 3600000
                }, (err, token) => {
                    if (err) {
                        console.log('Error occurred while generating token', err);
                        return false;
                    } else {
                        if (token != false) {
                            response.cookie('token', token, {
                                httpOnly: true,
                                expiresIn: 9000000
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
                            response.send("Could not create token");
                            response.end();
                        }
                    }
                });
            }).catch((result) => {
                if (result === undefined || result === false) {
                    loginResponse.error = true;
                    loginResponse.type = 'warning';
                    loginResponse.message = `Invalid username and password combination.`;
                    request.flash(loginResponse.type, loginResponse.message);
                    response.status(401).redirect('/');
                }
            });
        }).catch((val) => {
            loginResponse.error = true;
            loginResponse.type = 'warning';
            loginResponse.message = val;
            request.flash(loginResponse.type, loginResponse.message);
            response.status(420).redirect('/');
        });
    }
});

module.exports = router;