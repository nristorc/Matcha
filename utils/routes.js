'use strict';

class Routes{
    constructor(app){
        this.app = app;
    }

    appRoutes(){
        this.app.get('/', (request,response) => {
            response.render('index');
        });
    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;