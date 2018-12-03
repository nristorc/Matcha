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
        callback(null, request.session.user.id + '-' + Date.now() + path.extname(file.originalname));
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
                loginResponse.error = false;
                loginResponse.type = 'dark';
                loginResponse.userId = result[0].id;
                loginResponse.message = `User logged in.`;
                request.session.user = data;
                request.session.user.id = result[0].id;
                request.session.user.email = result[0].email;
                console.log(request.session.user);
                request.flash(loginResponse.type, loginResponse.message);
                response.status(200).redirect('/profil');
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