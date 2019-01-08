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

router.post('/', async (request, response)=> {
    const registrationResponse = {};
    const data = {
        lastname: request.body.lastname,
        firstname: request.body.firstname,
        email: request.body.email,
        username : request.body.username,
        password : request.body.password,
        confirmPassword : request.body.confirmPassword,
        active: false
    };

    if(data.lastname === '' || data.firstname === '' ||
        data.email === '' || data.username === '' ||
        data.password === '' || data.confirmPassword === '') {
        registrationResponse.error = true;
        registrationResponse.message = `Tous les champs doivent être remplis`;
        registrationResponse.type = 'warning';
        request.flash(registrationResponse.type, registrationResponse.message);
        response.status(412).redirect('/');
    } else {
        await validation.isName(data.firstname, 'Mauvais format du prénom', 30);
        await validation.isName(data.lastname, 'Mauvais format du nom de famille', 50);
        await validation.isAlpha(data.username, "Mauvais format de l'identifiant", 50);
        await validation.isEmail(data.email, "Mauvais format de l'email", 255);
        await validation.isConfirmed(data.password, data.confirmPassword, "Mauvais format du mot de passe", 255);

        if (validation.errors.length === 0) {

            const resultUsername  = await checkDb.checkUsername(data.username);
            const resultEmail = await checkDb.checkEmail(data.email);

            if (resultUsername[0].count !== 0 && resultEmail[0].count !== 0) {
                registrationResponse.error = true;
                registrationResponse.message = `Cet identifiant et cet email sont déjà utilisés`;
                registrationResponse.type = 'warning';
                request.flash(registrationResponse.type, registrationResponse.message);
                response.status(401).redirect('/');
            } else if (resultUsername[0].count !== 0 && resultEmail[0].count === 0) {
                registrationResponse.error = true;
                registrationResponse.message = `Cet identifiant est déjà utilisé`;
                registrationResponse.type = 'warning';
                request.flash(registrationResponse.type, registrationResponse.message);
                response.status(401).redirect('/');
            } else if (resultUsername[0].count === 0 && resultEmail[0].count !== 0) {
                registrationResponse.error = true;
                registrationResponse.message = `Cet email est déjà utilisé`;
                registrationResponse.type = 'warning';
                request.flash(registrationResponse.type, registrationResponse.message);
                response.status(401).redirect('/');
            }
            else {
                const result = await checkDb.registerUser(data);
                if (result === false) {
                    registrationResponse.type = 'warning';
                    registrationResponse.error = true;
                    registrationResponse.message = `Un problème est survenu, merci de recommencer ultérieurement`;
                    request.flash(registrationResponse.type, registrationResponse.message);
                    response.status(417).redirect('/');
                } else {
                    registrationResponse.error = false;
                    registrationResponse.userId = result.insertId;
                    registrationResponse.type = 'dark';
                    registrationResponse.message = `Votre inscription a bien été prise en compte. Merci d'activer votre compte via le lien envoyé par email`;
                    request.flash(registrationResponse.type, registrationResponse.message);
                    response.status(200).redirect('/');
                }
            }
        } else {
            registrationResponse.type = 'warning';
            registrationResponse.error = true;
            var errors = [];
            for (var i = 0; i < validation.errors.length; i++) {
                errors.push(validation.errors[i].errorMsg);
            }
            registrationResponse.message = errors;
            request.flash(registrationResponse.type, registrationResponse.message);
            response.status(417).redirect('/');
            validation.errors = [];
        }
    }
});

module.exports = router;