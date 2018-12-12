'use strict';
const express = require("express");
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');

const session = require('express-session');
var cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const expressMessages = require('express-messages');
const cors = require('cors');

const routes    = require('./utils/routes');
const login     = require('./utils/login');

const socketio = require('socket.io');
// const socketEvents = require('./utils/socket');



class Server{

    constructor(){
        this.port =  process.env.PORT || 3000;
        this.host = `localhost`;

        this.app = express();
        this.http = http.Server(this.app);
        this.io = socketio.listen(this.http);

        // this.socket = socketio(this.http);
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

        this.app.use(cors({
            origin: 'http://localhost:3000/',
            credentials: true
        }));

        this.app.use(flash());
        this.app.use(function (request, response, next) {
            response.locals.messages = expressMessages(request, response);
            next();
        });

        /* ROUTES */
        this.app.use('/login', login);

        /* EJS */
        this.app.set('views', './views');
        this.app.set('view engine', 'ejs');

        /* SOCKETS */

    }

    includeRoutes(){
        new routes(this.app).routesConfig();
        // new socketEvents(this.socket).socketConfig();
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