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


/* TEST */
app.get('/test', function (req, res) {
    const token = req.cookies.token;
    try {
        const verify = jwt.verify(token, 'ratonlaveur');
    } catch (e) {
        req.flash('warning', "Merci de vous inscrire ou de vous connecter à votre compte pour accèder à cette page");
        return res.render('index');
    }
    const decoded = jwt.verify(token, 'ratonlaveur', {
        algorithms: ['HS256']
    });

    io.use( async (socket, next) => {
        let userId = decoded.id;
        let userSocketId = socket.id;
        const response = await addSocketId(userId, userSocketId);
        if(response &&  response !== null){
            next();
        }else{
            console.error(`Socket connection failed, for  user Id ${decoded.id}.`);
        }
    });


        console.log('Un utilisateur est connecté');

        function socketEmit(eventName, params) {
            socket.emit(eventName, params);
        }

        function socketOn(eventName, callback) {
            socket.on(eventName, (response) => {
                if (callback) {
                    callback(response);
                }
            });
        }

        socketEmit('chat-list', decoded.id);
        socketOn('chat-list-response', (response) => {
            console.log('reponse socketON server', response);
        });
            // $scope.$apply( () =>{
            //     if (response) {
            //         $scope.data.chatlist = response.chatList;
            //     } else if (response && !decoded.id) {
            //         data.chatlist = data.chatlist.filter(function (obj) {
            //             return obj.socketid !== response.socketId;
            //         });
            //     }
            //         if (response.singleUser) {
            //             /*
            //             * Removing duplicate user from chat list array
            //             */
            //             if ($scope.data.chatlist.length > 0) {
            //                 $scope.data.chatlist = $scope.data.chatlist.filter(function (obj) {
            //                     return obj.id !== response.chatList.id;
            //                 });
            //             }
            //             /*
            //             * Adding new online user into chat list array
            //             */
            //             $scope.data.chatlist.push(response.chatList);
            //         } else if (response.userDisconnected) {
            //             /*
            //             * Removing a user from chat list, if user goes offline
            //             */
            //
            //         } else {
            //             /*
            //             * Updating entire chatlist if user logs in
            //             */
            //
            //         }
            //     } else {
            //
            //     }
            // });

    res.render('pages/testSocket');
});

/* EJS */
app.set('views', './views');
app.set('view engine', 'ejs');

/* SOCKETS */


/*TEST 2*/

function getMessages(userId, friendId) {
    return new Promise((resolve, reject) => {
        checkDb.query('SELECT message FROM matcha.messages WHERE from_user_id = ? AND to_user_id = ?',
            [userId, friendId])
            .then((response) => {
                resolve(response);
            }).catch((error) => {
            reject(error);
        });
    });
}

function getChatList(userId, userSocketId){
    try {
        return Promise.all([
            this.db.query(`SELECT id,username,online,socketid FROM matcha.users WHERE id = ?`, [userId]),
            this.db.query(`SELECT id,username,online,socketid FROM matcha.users WHERE online = ? and socketid != ?`, ['Y',userSocketId])
        ]).then( (response) => {
            return {
                userinfo : response[0].length > 0 ? response[0][0] : response[0],
                chatlist : response[1]
            };
        }).catch( (error) => {
            console.warn(error);
            return (null);
        });
    } catch (error) {
        console.warn(error);
        return null;
    }
}

io.sockets.on('connection', (socket) => {

    /**
     * get the user's Chat list
     */
    socket.on('chat-list', async (userId) => {

        let chatListResponse = {};

        if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

            chatListResponse.error = true;
            chatListResponse.message = `User does not exits.`;

            this.io.emit('chat-list-response',chatListResponse);
        }else{
            getChatList(userId, socket.id).then((result) => {
                io.sockets.to(socket.id).emit('chat-list-response', {
                    error: result !== null ? false : true,
                    singleUser: false,
                    chatList: result.chatlist
                });

                socket.broadcast.emit('chat-list-response', {
                    error: result !== null ? false : true,
                    singleUser: true,
                    chatList: result.userinfo
                });
            }).catch((result) => {
                throw result;
            });
        }
    });

});

function scrollToBottom() {
    const messageThread = document.querySelector('.message-thread');
    setTimeout(() => {
        messageThread.scrollTop = messageThread.scrollHeight + 500;
    }, 10);
}

async function addSocketId(userId, userSocketId) {
    try {
        return await checkDb.query(`UPDATE matcha.users SET socketid = ?, online= ? WHERE id = ?`, [userSocketId,'Y',userId]);
    } catch (error) {
        console.log(error);
        return null;
    }
}