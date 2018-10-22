const db = require('../utils/database');

class DatabaseRequest {

    constructor(){
        this.db = db;
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }

    async loginUser(params){
        try {
            return await this.db.query(`SELECT id FROM matcha.users WHERE LOWER(username) = ? AND password = ?`, [params.username, params.password]);
        } catch (error) {
            return null;
        }
    }
}

module.exports = DatabaseRequest;