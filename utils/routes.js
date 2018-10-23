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
            response.render('index');
        });

        this.app.post('/', async (request, response)=> {
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
                    response.status(200).render('pages/loggedIn', {username: data.username, password: data.password, message: loginResponse.message});
                }
            }
        });

        this.app.post('/', async (request,response) => {
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
            }
            else {
                const result = await validation.isName(data.firstname, 'Wrong firstname')
            }
            /*else{
                const result = await checkDb.registerUser( data );
                if (result === null) {
                    registrationResponse.error = true;
                    registrationResponse.message = `User registration unsuccessful,try after some time.`;
                    response.status(417).json(registrationResponse);
                } else {
                    registrationResponse.error = false;
                    registrationResponse.userId = result.insertId;
                    registrationResponse.message = `User registration successful.`;
                    response.status(200).json(registrationResponse);
                }
            }*/
        });
    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;