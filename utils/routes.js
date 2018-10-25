'use strict';

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();

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
                password: request.body.password
            };
            if (data.username === '' || data.username === null) {
                loginResponse.error = true;
                loginResponse.message = `username cant be empty.`;
                response.status(412).json(loginResponse);
            } else if(data.password === '' || data.password === null){
                loginResponse.error = true;
                loginResponse.message = `password cant be empty.`;
                response.status(412).json(loginResponse);
            } else {
                const result = await checkDb.loginUser(data);
                console.log(result);
                if (result === null ||result.length === 0) {
                    loginResponse.error = true;
                    loginResponse.message = `Invalid username and password combination.`;
                    console.log('Invalid username or password');
                    response.status(401).render('pages/error', {message: loginResponse.message});
                } else {
                    loginResponse.error = false;
                    loginResponse.userId = result[0].id;
                    console.log(data);
                    loginResponse.message = `User logged in.`;
                    request.session.user = data;
                    response.status(200).render('pages/loggedIn', {username: data.username, password: data.password, message: loginResponse.message});
                }
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
    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;