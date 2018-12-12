const ent = require('ent');
const jwt = require('jsonwebtoken');
// var count = 0;

class Socket{
    constructor(socket){
        this.io = socket;
        this.users = [];
    }

    socketEvents(){
        this.io.on('connection', (socket) => {

            // let currentUser = null;
            // try {
            //     socket.on('identify', ({token}) => {
            //         let decoded = jwt.verify(token, 'ratonlaveur', {
            //             algorithms: ['HS256']
            //         });
            //         console.log('decode token', decoded);
            //         currentUser = {
            //             id: decoded.id,
            //             username: decoded.username,
            //             email: decoded.email,
            //             count: 1
            //         };
            //         let user = this.users.find(u => u.id === currentUser.id);
            //         if (user) {
            //             user.count++;
            //         } else {
            //             this.users.push(currentUser);
            //             socket.broadcast.emit('user.new', {user: currentUser});
            //         }
            //         socket.emit('users', {users: this.users});
            //     });
            // } catch (e) {
            //     console.log('an error occured: ', e);
            // }
            //
            // socket.on('disconnect', () => {
            //     if (currentUser) {
            //         let user = this.users.find(u => u.id === currentUser.id);
            //         if (user) {
            //             user.count--;
            //             if (user.count === 0) {
            //                 this.users = this.users.filter(u => u.id !== currentUser.id);
            //                 socket.broadcast.emit('users.leave', {user: currentUser})
            //             }
            //         }
            //     }
            // });
        });
    }

    socketConfig(){
        this.socketEvents();
    }
}
module.exports = Socket;