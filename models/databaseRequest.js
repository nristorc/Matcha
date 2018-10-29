const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');

const str = require('../models/str');
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
                this.query("SELECT active FROM matcha.users WHERE username = ?", [params]).then((resultActive) => {
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

    async checkEmail(params){
        console.log('email: ', params);
        return await this.query(`SELECT count(email) as count FROM matcha.users WHERE email = ?`, [params]);
    }

    async checkSecretToken(param){
        try {
            return new Promise((resolve, reject) => {
                console.log('param: ',param);
                this.query(`SELECT * FROM matcha.users WHERE secretToken = ?`, [param]).then((result) => {
                    console.log('select query: ', result);
                    if (result && result[0] && result[0].secretToken === param && result[0].active === 0) {
                        console.log('le token existe');
                        this.query("UPDATE matcha.users SET `secretToken` = 'NULL', `active` = 1 WHERE users.secretToken = ?", [param]);
                        resolve(
                            this.query(`SELECT username, password FROM matcha.users WHERE id = ?`, [result[0].id])
                        );
                    } else {
                        console.log("Le token n'existe pas");
                        reject();
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return false;
        }


        //console.log('token: ', param);
        //return );
    }

    async registerUser(params) {
        try {
            bcrypt.hash(params['password'], saltRounds, (err, hash) => {

                const secretToken = str.randomString(30);

                this.query("INSERT INTO matcha.users (email, firstname, lastname, username, password, created_at, secretToken, active)" +
                    "VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)",
                    [params['email'], params['firstname'], params['lastname'], params['username'], hash, secretToken, params['active']],
                    function (error, results, fields) { if (error) throw error; });

                //Sending emails
                const output = `
                    <p>You have been registered to our Website</p>
                    <h3>Contact Details</h3>
                    <ul>
                    <li>FirstName: ${params['firstname']}</li>
                    <li>LastName: ${params['lastname']}</li>
                    <li>Email: ${params['email']}</li>
                    <li>Username: ${params['username']}</li>
                    </ul>
                    <h3>Link to confirm</h3>
                    <p><a href="http://localhost:3000/verify/${secretToken}">Verify your account</a></p>
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
                    from: '"Nodemailer Contact" <nina.ristorcelli@gmail.com>', // sender address
                    to: params['email'], // list of receivers
                    subject: 'Confirm your Registration to Matcha website', // Subject line
                    text: 'Hello world?', // plain text body
                    html: output // html body
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });


            });



            return true;
        } catch (error){
            console.log(error);
            return false;
        }
    }

}

module.exports = DatabaseRequest;