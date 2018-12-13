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

// const routes    = require('./utils/routes');
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


/* TEST */
app.get('/test', function (req, res) {
    res.render('pages/testSocket');
});

/* EJS */
app.set('views', './views');
app.set('view engine', 'ejs');

/* SOCKETS */
// io.sockets.on('connection', function (socket) {
//     console.log('Un utilisateur est connecté');
//     socket.on('send-message', function (data) {
//         io.sockets.emit('new-message', data);
//     })
// });
