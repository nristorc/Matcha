'use strict';

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

class Routes{
    constructor(app){
        this.app = app;
    }

    appRoutes(){
        this.app.get('/', (request,response) => {
            response.render('index');
        });

        this.app.post('/', (request, response)=> {
            const loginResponse = {};
            const data = {
                username: request.body.username,
                password: request.body.password
            };
            if(data.username === '' || data.username === null) {
                loginResponse.error = true;
                loginResponse.message = `username cant be empty.`;
                response.status(412).json(loginResponse);
            }else if(data.password === '' || data.password === null){
                loginResponse.error = true;
                loginResponse.message = `password cant be empty.`;
                response.status(412).json(loginResponse);
            }else {
                const result = await checkDb.loginUser(data);
                if (result === null ||result.length === 0) {
                    loginResponse.error = true;
                    loginResponse.message = `Invalid username and password combination.`;
                    response.status(401).json(loginResponse);
                }
            }
        });
    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;