const mysql = require('mysql');

class DatabaseRequest {

    constructor(){
            this.connection = mysql.createPool({
                connectionLimit: 100,
                host: 'localhost',
                user: 'root1',
                password: 'root00',
                database: 'matcha',
                debug: false
            });
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
            return await this.query(`SELECT id FROM matcha.users WHERE LOWER(username) = ? AND password = ?`, [params.username, params.password]);
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = DatabaseRequest;