const databaseRequest = require("./databaseRequest");
const checkDb = new databaseRequest();

class Sockets {

    async addSocketId(userId, userSocketId) {
    try {
        return new Promise ((resolve, reject) => {
            checkDb.query(`UPDATE matcha.users SET socketid = ?, online = ? WHERE id = ?`, [userSocketId,'Y',userId]).then((result) => {
                if (result) {
                    resolve();
                } else {
                    reject();
                }
            });
        })
    } catch (error) {
        throw error;
    }
}

}

module.exports = Sockets;