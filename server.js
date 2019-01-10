var express = require('express');
const app = express();
const server = require('http').createServer(app);
io = require('socket.io').listen(server, {pingInterval: 1000, pingTimeout: 5000});
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
const tagSearch = require('./utils/tagSearch');
const notifications = require('./utils/notifications');
const sendActivation = require('./utils/sendActivation');
const notFound = require('./utils/notFound');
const maps = require('./utils/maps');
const errors = require('./utils/errors');

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

usersSocket = [];

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
app.use('/tagsearch', tagSearch);
app.use('/notifications', notifications);
app.use('/sendActivation', sendActivation);
app.use('/notFound', notFound);
app.use('/maps', maps);
app.use('/errors', errors);

app.use((req, res, next) => {
    res.status(404).redirect('/notFound')
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).redirect('/errors')
});

/* EJS */
app.set('views', './views');
app.set('view engine', 'ejs');

/* SOCKETS */
const jwtSecret = 'ratonlaveur';

io.sockets.on('connection', (socket) => {
    let currentUser = null;

    socket.on('identify', ({token}) => {
        try{
            const decoded = jwt.verify(token, jwtSecret, {
                algorithms: ['HS256']
            });
            currentUser = {
                id: decoded.id,
                count: 1
            };
            let user = usersSocket.find(u => u.id === currentUser.id);
            if (user) {
                user.count++;
            } else {
                currentUser.socket = socket.id;
                usersSocket.push(currentUser)
            }
                const getUnreadNotifications = 'SELECT count(unread) as allUnread FROM matcha.notifications WHERE `to` = ?';
                checkDb.query(getUnreadNotifications, [decoded.id]).then((result1) => {
                    checkDb.getMatches(decoded.id).then((tab) => {
                        const tableau = Array.from(tab);
                        if (tab != "") {
                            const sqlCondition = tab.map(el => 'from_user_id = ?').join(' OR ');
                            const sql = 'SELECT count(unread) as allUnread FROM matcha.messages WHERE (' + sqlCondition + ') AND to_user_id = ?;';

                            tableau.push(decoded.id);
                            checkDb.query(sql, tableau).then((result) => {

                                const sqlCondition2 = tab.map(el => 'from_user_id = ?').join(' OR ');
                                const sql2 = 'SELECT count(unread) as allUnread FROM matcha.messages INNER JOIN matcha.reports WHERE (' + sqlCondition2 + ') AND matcha.messages.from_user_id = matcha.reports.reported_id AND matcha.reports.flag = 2 AND matcha.messages.to_user_id = ?';
                                checkDb.query(sql2, tableau).then((result2) => {
                                    if (parseInt(result[0].allUnread) - parseInt(result2[0].allUnread) > 0) {
                                        socket.broadcast.emit('users.new', {user: currentUser});
                                        socket.emit('allUnreadMsg', {countMsg: parseInt(result[0].allUnread) - parseInt(result2[0].allUnread)});
                                        socket.emit('allUnreadNotif', {countNotif: parseInt(result1[0].allUnread)});
                                    } else {
                                        socket.broadcast.emit('users.new', {user: currentUser});
                                        socket.emit('allUnreadMsg', {countMsg: 0});
                                        socket.emit('allUnreadNotif', {countNotif: parseInt(result1[0].allUnread)});
                                    }
                                })
                            }).catch((err) => {
                                console.log('err in getMatches for messages and notifications: ', err);
                            });
                        } else {
                            socket.broadcast.emit('users.new', {user: currentUser});
                            socket.emit('allUnreadMsg', {countMsg: 0});
                            socket.emit('allUnreadNotif', {countNotif: parseInt(result1[0].allUnread)});
                        }
                    }).catch((err) => {
                        console.log('An error occured :' , err);
                    });
                }).catch((err) => {
                    console.log('get notifications error: ', err);
                });

        } catch (e) {
            throw e.message;
        }
    });

    /**
     * Nouveaux Messages Chat
     */


    socket.on('newMsg', (info) => {
        if (info.message !== '') {
            const checkBlock = 'SELECT reported_id FROM matcha.reports WHERE report_id = ? AND flag = 2';
            checkDb.query(checkBlock, [info.toUser]).then((block) => {
                // User blocked
                if (block[0] && block[0].reported_id === info.fromUser) {

                        var u = usersSocket.reduce((acc, elem) => {
                            if (elem.id == info.toUser) {
                                acc.push(elem);
                            }
                            return acc;
                        }, []);
                        socket.emit('blockMessage', {users: usersSocket, msg: "Cet utilisateur vous a bloqué, vous ne pouvez plus lui envoyer de message"});

                } else {
                    // User unmatched
                    checkDb.getSpecificMatch(info.fromUser, info.toUser).then((result) => {
                        const newMsg = 'INSERT INTO matcha.messages SET from_user_id = ?, to_user_id = ?, message = ?, unread = 1';
                        checkDb.query(newMsg, [info.fromUser, info.toUser, info.message]).then((result) => {
                            if (result) {
                                var u = usersSocket.reduce((acc, elem) => {
                                    if (elem.id == info.toUser) {
                                        acc.push(elem);
                                    }
                                    return acc;
                                }, []);
                                socket.emit('sendingMessage', {users: usersSocket, msg: info, date: new Date()});
                                u.forEach(user => {
                                    io.sockets.connected[user.socket].emit('sendingMessage', {users: usersSocket, msg: info, date: new Date()});
                                })
                            }
                        }).catch((err) => {
                            console.log('an error occured: ', err);
                        });
                    }).catch((result) => {var u = usersSocket.reduce((acc, elem) => {
                        if (elem.id == info.toUser) {
                            acc.push(elem);
                        }
                        return acc;
                    }, []);
                        socket.emit('blockMessage', {users: usersSocket, msg: "Vous ne matchez plus avec cet utilisateur, vous ne pouvez plus lui envoyer de message"});
                    });


                }
            }).catch((err) => {
                console.log('an error occured in chat: ', err);
            });
        }
    });

    socket.on('readMsg', (msg) => {
        const updateRead = 'UPDATE matcha.messages SET unread = null WHERE from_user_id = ? AND to_user_id = ?';
        checkDb.query(updateRead, [msg.msg.fromUser, msg.msg.toUser]).then((result) => {
        }).catch((err) => {
            console.log('erreur on update unread message ', err);
        })
    });

    socket.on('okreadyUser', (userId) => {
        getLastOnline = 'SELECT lastOnline FROM matcha.users WHERE id = ?';
        checkDb.query(getLastOnline, [userId]).then((date) => {
            socket.emit('onlineUser', {userOnline: userId, users: usersSocket, date: date[0].lastOnline});
        }).catch((err) => {
            console.log('error getting lastOnline date', err);
        });
    });

    socket.on('okreadyChat', (userId) => {
        socket.emit('onlineChat', {userOnline: userId, users: usersSocket});
    });

    socket.on('okreadyHisto', (userId) => {
        socket.emit('onlineHisto', {userOnline: userId, users: usersSocket});
    });

    socket.on('okreadySearch', (userId) => {
        socket.emit('onlineSearch', {userOnline: userId, users: usersSocket});
    });

    socket.on('disconnect', () => {
        if (currentUser) {
            let user = usersSocket.find(u => u.id === currentUser.id);
            if (user) {
                user.count--;
                if (user.count === 0) {
                    // Deconnexion utilisateur
                    checkDb.updateOnlineStatus(currentUser.id, 'logout');
                    usersSocket = usersSocket.filter(u => u.id !== currentUser.id);
                    socket.broadcast.emit('users.leave', {user: currentUser});

                }
            }
        }
    })
});