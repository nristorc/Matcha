const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server, {pingInterval: 1000, pingTimeout: 5000});
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const expressMessages = require('express-messages');
const cors = require('cors');

const databaseRequest = require("./models/databaseRequest");
const checkDb = new databaseRequest();

const sockets = require("./models/socketsEvents");
const socketsEvents = new sockets();

const login     = require('./utils/login');
const index     = require('./utils/index');
const register = require('./utils/register');
const resetPassword = require('./utils/resetPassword');
const registerToken = require('./utils/registerToken');
const resetToken = require('./utils/resetToken');
const logout = require('./utils/logout');
const profil = require('./utils/profil');
const search = require('./utils/search');
const userSearch = require('./utils/usersearch');
const user = require('./utils/user');
const history = require('./utils/history');
const chat = require('./utils/chat');

const port =  process.env.PORT || 3000;
const host = 'localhost';

const jwt = require('jsonwebtoken');

server.listen(port, host, () => {
    console.log('Listening on http://' + host + ':' + port + ')');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

/* COOKIES AND SESSIONS */

app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: 'somerandomstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 9000000, httpOnly: true }
}));

app.use(cors({
    origin: 'http://localhost:3000/',
    credentials: true
}));

app.use(flash());
app.use(function (request, response, next) {
    response.locals.messages = expressMessages(request, response);
    next();
});

/* ROUTES */

app.use('/', index);
app.use('/login', login);
app.use('/register', register);
app.use('/resetPassword', resetPassword);
app.use('/verify/register', registerToken);
app.use('/verify/reset', resetToken);
app.use('/logout', logout);
app.use('/profil', profil);
app.use('/search', search);
app.use('/usersearch', userSearch);
app.use('/user', user);
app.use('/history', history);
app.use('/chat', chat);

/* EJS */
app.set('views', './views');
app.set('view engine', 'ejs');

/* TEST SOCKETS */
const jwtSecret = 'ratonlaveur';
let users = [];

app.get('/test', function (request, response) {
    const token = request.cookies.token;
    try {
        const decoded = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256']
        });
        response.render('pages/testSocket', {token});
    } catch (e) {
        request.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return response.render('index');
    }
});

io.sockets.on('connection', (socket) => {
    let currentUser = null;

    socket.on('identify', ({token}) => {
        try{
            const decoded = jwt.verify(token, jwtSecret, {
                algorithms: ['HS256']
            });
            currentUser = {
                id: decoded.id,
                username: decoded.username,
                count: 1
            };
            console.log('currentUser', currentUser);
            // let user = users.find(u => u.id === currentUser.id);
            // console.log(user);
            // if (user) {
            //     user.count++;
            // } else {
            //     users.push(currentUser);
            //     socket.broadcast.emit('users.new', {user: currentUser});
            // }
            // socket.emit('users', {users});
        } catch (e) {
            throw e.message;
        }
    });

    socket.on('disconnect', () => {
        if (currentUser) {
            let user = users.find(u => u.id === currentUser.id);
            if (user) {
                user.count--;
                if (user.count === 0) {
                    users = users.filter(u => u.id !== currentUser.id);
                    socket.broadcast.emit('users.leave', {user: currentUser});
                }
            }
        }
    })
});


// function scrollToBottom() {
//     const messageThread = document.querySelector('.message-thread');
//     setTimeout(() => {
//         messageThread.scrollTop = messageThread.scrollHeight + 500;
//     }, 10);
// }

//