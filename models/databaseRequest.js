const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');

const str = require('../models/str');
const fs = require('fs');
const hogan = require('hogan.js');
const random = new str();

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
            return new Promise((resolve, reject) => {
                this.query("SELECT password FROM matcha.users WHERE username = ?", [params.username]).then((hash) => {
                    if (hash && hash[0] && hash[0].password) {
                        bcrypt.compare(params.password, hash[0].password, (err, res) => {
                            if (res === true) {
                                resolve(this.query(`SELECT id FROM matcha.users WHERE LOWER(username) = ? AND password = ?`, [params.username, hash[0].password]));
                            } else {
                                reject();
                            }
                        });
                    } else {
                        reject();
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async checkActive(params){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT active FROM matcha.users WHERE username = ? OR email = ?", [params, params]).then((resultActive) => {
                    if (resultActive && resultActive[0] !== undefined) {
                        if (resultActive[0].active === 1) {
                            resolve();
                        } else {
                            reject('non active user');
                        }
                    } else {
                        reject('non existing user');
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async checkUsername(params){
        console.log('username: ',params);
        return await this.query(`SELECT count(username) as count FROM matcha.users WHERE username = ?`, [params]);
    }

    async checkResetToken(params){
        return await this.query(`SELECT count(resetToken) as count FROM matcha.users WHERE resetToken = ?`, [params]);
    }

    async checkEmail(params){
        console.log('email: ', params);
        return await this.query(`SELECT count(email) as count FROM matcha.users WHERE email = ?`, [params]);
    }

    async checkRegisterToken(param){
        try {
            return new Promise((resolve, reject) => {
                //console.log('param: ',param);
                this.query(`SELECT * FROM matcha.users WHERE registerToken = ?`, [param]).then((result) => {
                    //console.log('select query: ', result);
                    if (result && result[0] && result[0].registerToken === param && result[0].active === 0) {
                        //console.log('le token existe');
                        this.query("UPDATE matcha.users SET `registerToken` = 'NULL', `active` = 1 WHERE users.registerToken = ?", [param]);
                        resolve(
                            this.query(`SELECT username, password, id FROM matcha.users WHERE id = ?`, [result[0].id])
                        );
                    } else {
                        //console.log("Le token n'existe pas");
                        reject();
                    }
                });
            });
        } catch (error) {
            //console.log(error);
            return false;
        }
    }

    async registerUser(params) {
        try {
            bcrypt.hash(params['password'], saltRounds, (err, hash) => {

                const registerToken = str.randomString(30);

                this.query("INSERT INTO matcha.users (email, firstname, lastname, username, password, created_at, registerToken, active)" +
                    "VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)",
                    [params['email'], params['firstname'], params['lastname'], params['username'], hash, registerToken, params['active']],
                    function (error, results, fields) { if (error) throw error; });

                //Sending emails

                const template = fs.readFileSync('views/pages/registrationEmail.ejs', 'utf-8');
                const compiledTemplate = hogan.compile(template);

                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'nina.ristorcelli@gmail.com', // generated ethereal user
                        pass: 'wasfvdajlwqpgjfo'  // generated ethereal password
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                });

                let mailOptions = {
                    from: '"RoooCool Admin" <nina.ristorcelli@gmail.com>', // sender address
                    to: params['email'], // list of receivers
                    subject: 'Confirm your Registration to Matcha website', // Subject line
                    text: 'Hello world?', // plain text body
                    html: compiledTemplate.render({username: params['username'], registerToken: registerToken}) // render template
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
            });
            return true;
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async resetToken (params) {
        try {
                const resetToken = str.randomString(30);
                this.query("UPDATE matcha.users SET resetToken = ?, reset_at = NOW() WHERE email = ?",
                    [resetToken, params],
                    function (error, results, fields) { if (error) throw error; });

                //Sending emails
                const output = `
                    <p>You ask for a reset of your Password :-)</p>
                    
                    <h3>Clink of this link to RESET</h3>
                    <p><a href="http://localhost:3000/verify/reset/${resetToken}">Reset</a></p>
                    `;

                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'nina.ristorcelli@gmail.com', // generated ethereal user
                        pass: 'wasfvdajlwqpgjfo'  // generated ethereal password
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                });

                let mailOptions = {
                    from: '"RoooCool Team" <nina.ristorcelli@gmail.com>', // sender address
                    to: params, // list of receivers
                    subject: 'Reset your password of your Rooocool account', // Subject line
                    text: 'Hello world?', // plain text body
                    html: output // html body
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
            return true;
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async resetPassword(params) {
        try {
            bcrypt.hash(params['newPassword'], saltRounds, (err, hash) => {
                this.query("UPDATE matcha.users SET password = ?, resetToken = NULL, reset_at = NULL WHERE resetToken = ?",
                    [hash, params['resetToken']],
                    function (error, results, fields) { if (error) throw error; });
            });
            return true;
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getUser(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT *, DATE_FORMAT(birth, '%d/%m/%Y') AS birth FROM matcha.users WHERE username = ?";
                this.query(sql, params).then((user) => {
                    if (user){
                        resolve(user);
                    } else {
                        reject('no user found');
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getAllUsers(){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT *, DATE_FORMAT(birth, '%d/%m/%Y') AS birth FROM matcha.users WHERE registerToken = 'NULL'";
                this.query(sql).then((users) => {
                    if (users){
                        resolve(users);
                    } else {
                        reject('no user found');
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getTags(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.tags WHERE user_id = ?";
                this.query(sql, params).then((tags) => {
                    if (tags){
                        // console.log(tags);
                        resolve(tags);
                    } else {
                        // console.log(tags);
                        reject(tags);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

}

module.exports = DatabaseRequest;