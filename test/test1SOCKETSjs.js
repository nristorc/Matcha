/*TEST 1 PRIVATE MESSAGING - MAIS DISPLAY OLD MESSAGES DE TOUS LES USERS*/

// Code a mettre dans serveur.js

app.get('/test', function (req, res) {
    res.render('pages/testSocket');
});

const users = {};
io.sockets.on('connection', function (socket) {
    console.log('Un utilisateur est connecté');

    socket.on('new-user', function (data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    }

    socket.on('send-message', function (data, callback) {
        var msg = data.trim();
        if (msg.substr(0,3) === '/w ') {
            msg = msg.substr(3);
            var index = msg.indexOf(' ');
            if (index !== -1) {
                var name = msg.substring(0, index);
                var msg = msg.substring(index + 1);
                if (name in users) {
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                    console.log('Whisper!');
                } else {
                    callback('Error! Enter a valid user');
                }
            } else {
                callback('Error ! Please enter a message for your whisper');
            }
        } else {
            checkDb.query('INSERT INTO matcha.messages (`nickname`, `message`) VALUES (?, ?)',
                [socket.nickname, msg]).then(() => {
                io.sockets.emit('new-message', {msg: msg, nick: socket.nickname});
            }).catch((err) => {
                throw err;
            });
        }
    });

    socket.on("disconnect", function(data){
        console.log("socket disconnected");
        if (!socket.nickname)
            return;
        delete users[socket.nickname];
        updateNicknames();
    });
});