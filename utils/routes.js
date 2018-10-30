'use strict';

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();

//var cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

class Routes{
    constructor(app){
        this.app = app;
    }

    appRoutes(){
        this.app.get('/', (request,response) => {
            if (!request.session.user) {
                return response.render('index');
            }
            response.render('pages/dashboard');
        });

        this.app.post('/login', async (request, response)=> {
            const loginResponse = {};
            const data = {
                username: request.body.username,
                password: request.body.password,
            };
            if ((data.username === '' || data.username === null) && (data.password === '' || data.password === null)) {
                loginResponse.error = true;
                loginResponse.message = `fields cannot be empty`;
                response.status(412).json(loginResponse);
            } else if (data.username === '' || data.username === null) {
                loginResponse.error = true;
                loginResponse.message = `username cant be empty.`;
                response.status(412).json(loginResponse);
            } else if(data.password === '' || data.password === null){
                loginResponse.error = true;
                loginResponse.message = `password cant be empty.`;
                response.status(412).json(loginResponse);
            } else {
                checkDb.checkActive(data.username).then(() => {
                    checkDb.loginUser(data).then( (result) => {
                        loginResponse.error = false;
                        loginResponse.userId = result[0].id;
                        loginResponse.message = `User logged in.`;
                        request.session.user = data;
                        response.status(200).render('pages/loggedIn', {
                            username: data.username,
                            password: data.password,
                            message: loginResponse.message
                        });
                    }).catch((result) => {
                        if (result === undefined || result === false) {
                            loginResponse.error = true;
                            loginResponse.message = `Invalid username and password combination.`;
                            console.log('Invalid username or password');
                            response.status(401).render('pages/error', {message: loginResponse.message});
                        }
                    });
                }).catch((val) => {
                    loginResponse.error = true;
                    loginResponse.message = val;
                    response.status(420).json(loginResponse);
                });
            }
        });

        this.app.post('/register', async (request,response) => {
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
                registrationResponse.message = `One of the fields is empty -- ALL MANDATORY`;
                response.status(412).json(registrationResponse);
            } else {
                await validation.isName(data.firstname, 'Wrong firstname');
                await validation.isName(data.lastname, 'Wrong lastname');
                await validation.isAlpha(data.username, 'Wrong username');
                await validation.isEmail(data.email, "Wrong Email");
                await validation.isConfirmed(data.password, data.confirmPassword, "Wrong matching password");
                console.log(validation.errors);

                if (validation.errors.length === 0) {
                    console.log('on passe au check db !');
                    const resultUsername  = await checkDb.checkUsername(data.username);
                    const resultEmail = await checkDb.checkEmail(data.email);
                    console.log('count db username: ', resultUsername[0].count);
                    console.log('count db email: ', resultEmail[0].count);

                    if (resultUsername[0].count !== 0 && resultEmail[0].count !== 0) {
                        response.status(401).json({
                            error:true,
                            message: 'This username and email are already taken.'
                        });
                    } else if (resultUsername[0].count !== 0 && resultEmail[0].count === 0) {
                        response.status(401).json({
                            error:true,
                            message: 'This username is already taken.'
                        });
                    } else if (resultUsername[0].count === 0 && resultEmail[0].count !== 0) {
                        response.status(401).json({
                            error:true,
                            message: 'This email is already taken.'
                        });
                    }
                    else {
                        console.log("Je peux ajouter le nouvel utilisateur !! Youpiiii");
                        const result = await checkDb.registerUser(data);
                        console.log(result);
                        if (result === false) {
                            registrationResponse.error = true;
                            registrationResponse.message = `User registration unsuccessful,try after some time.`;
                            response.status(417).json(registrationResponse);
                        } else {
                            registrationResponse.error = false;
                            registrationResponse.userId = result.insertId;
                            registrationResponse.message = `User registration successful.`;
                            response.status(200).render('pages/registered',
                                { firstname: data.firstname, lastname: data.lastname,
                                    username: data.username, password: data.password, email: data.email });
                        }
                    }
                } else {
                    registrationResponse.error = true;
                    registrationResponse.message = `Error fields format... Check which is wrong please`;
                    response.status(417).json(registrationResponse);
                    validation.errors = [];
                }
            }
        });

        this.app.post('/resetPassword', async (request, response) => {
            const checkingResponse = {};
            const valid = await validation.isEmail(request.body.checkEmail, "Wrong Email");
            console.log("Email du formulaire ",request.body.checkEmail);
            console.log("Variable Valid: ",valid);
            console.log("Tableau d'erreur: ",validation.errors);
            if (valid && validation.errors !== []) {
                console.log("Le format de l'email est incorrect");
                checkingResponse.error = true;
                checkingResponse.message = `Mauvais format d'email`;
                response.status(417).json(checkingResponse);
                validation.errors = [];
            } else {
                console.log("Format OK, je checke la DB");
                const resultEmail = await checkDb.checkEmail(request.body.checkEmail);
                if (resultEmail[0].count === 0) {
                    console.log("DB: Email non trouvé");
                    response.status(401).json({
                        error:true,
                        message: 'Aucun email correspondant dans la base de données'
                    });
                } else {
                    console.log('All good, je peux envoyer mon mail de reset');
                    checkDb.resetToken(request.body.checkEmail);
                }
            }
        });

        this.app.get('/verify/:registerToken', async (request, response) => {
            const loginResponse = {};
            checkDb.checkRegisterToken(request.params.registerToken).then((result) => {
                const data = {
                    username: result[0].username,
                    password: result[0].password
                };
                loginResponse.error = false;
                loginResponse.userId = result[0].id;
                loginResponse.message = `User logged in.`;
                request.session.user = data;
                response.status(200).render('pages/loggedIn', {
                    username: data.username,
                    password: data.password,
                    message: loginResponse.message
                });
            }).catch(() => {
                loginResponse.error = true;
                loginResponse.message = `Token not valid`;
                console.log('Token not valid');
                response.status(401).render('index');
            });
        });

        this.app.get('/loggedIn', (request, response) => {
            console.log(request.session);
            console.log(request.session.user);
            if (!request.session.user) {
                console.log('pas de session');
                return response.status(401).send();
            }
            console.log('1 session');
            return response.status(200).send('Welcome to your Dashboard !');
        });

        this.app.get('/logout', function(request, result){
            let cookie = request.cookies;
            for (var prop in cookie) {
                if (!cookie.hasOwnProperty(prop)) {
                    continue;
                }
                result.cookie(prop, '', {expires: new Date(0)});
                request.session = null;
            }
            result.redirect('/');
        });
    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;