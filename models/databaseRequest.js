const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');
//const myPlaintextPassword = 's0/\/\P4$$w0rD';
//const someOtherPlaintextPassword = 'not_bacon';

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

    async checkUsername(params){
        console.log('username: ',params);
        return await this.query(`SELECT count(username) as count FROM matcha.users WHERE username = ?`, [params]);
    }

    async checkEmail(params){
        console.log('email: ', params);
        return await this.query(`SELECT count(email) as count FROM matcha.users WHERE email = ?`, [params]);
    }

    async registerUser(params) {
        try {
            bcrypt.hash(params['password'], saltRounds, (err, hash) => {
                this.query("INSERT INTO matcha.users (email, firstname, lastname, username, password, created_at)" +
                    "VALUES (?, ?, ?, ?, ?, NOW())", [params['email'], params['firstname'], params['lastname'], params['username'], hash],
                    function (error, results, fields) { if (error) throw error; });
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
                    <p>TEST</p>
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