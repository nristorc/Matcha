'use strict';
const express = require("express");
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');

const session = require('express-session');
var cookieParser = require('cookie-parser');

const routes = require('./utils/routes');

class Server{

    constructor(){
        this.port =  process.env.PORT || 3000;
        this.host = `localhost`;

        this.app = express();
        this.http = http.Server(this.app);
    }

    appConfig(){
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use('/public', express.static('public'));
        this.app.use(express.static(path.join(__dirname, 'public')));

        /* COOKIES AND SESSIONS */
        this.app.use(cookieParser());
        this.app.use(session({
            key: 'user_sid',
            secret: 'somerandomstuffs',
            resave: false,
            saveUninitialized: false,
            cookie: { expires: 600000 }
        }));

        this.app.set('views', './views');
        this.app.set('view engine', 'ejs');

    }

    includeRoutes(){
        new routes(this.app).routesConfig();
    }

    appExecute(){
        this.appConfig();
        this.includeRoutes();
        this.http.listen(this.port, this.host, () => {
            console.log(`Listening on http://${this.host}:${this.port}`);
        });
    }
}

const app = new Server();
app.appExecute();