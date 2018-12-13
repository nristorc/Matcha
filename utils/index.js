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
const jwt = require('jsonwebtoken');

router.get('/', async (request,response) => {
    if (!request.cookies.token) {
        response.status(200).render('index');
    } else {
        const token = request.cookies.token;
        try {
            const verify = jwt.verify(token, 'ratonlaveur');
        } catch (e) {
            request.flash('warning', "Une erreur s'est produite... merci de recommencer");
            return response.render('index');
        }
        const decoded = jwt.verify(token, 'ratonlaveur', {
            algorithms: ['HS256']
        });
        response.status(200).redirect('/profil');
    }
});

module.exports = router;