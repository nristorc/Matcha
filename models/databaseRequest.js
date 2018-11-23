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
                                resolve(this.query(`SELECT id, email FROM matcha.users WHERE LOWER(username) = ? AND password = ?`, [params.username, hash[0].password]));
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
        return await this.query(`SELECT count(username) as count FROM matcha.users WHERE username = ?`, [params]);
    }

    async checkPassword(params, user){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT password FROM matcha.users WHERE id = ?", [user]).then((hash) => {
                    if (hash && hash[0] && hash[0].password) {
                        bcrypt.compare(params.currentPassword, hash[0].password, (err, res) => {
                            if (res === true) {
                                resolve(res);
                            } else {
                                reject({errorMsg: 'Mot de passe actuel incorrect'});
                            }
                        });
                    } else {
                        reject({errorMsg:"Une erreur s'est produite, merci de bien vouloir reéessayer ultérieurement"});
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }

    }

    async checkResetToken(params){
        return await this.query(`SELECT count(resetToken) as count FROM matcha.users WHERE resetToken = ?`, [params]);
    }

    async checkEmail(params){
        return await this.query(`SELECT count(email) as count FROM matcha.users WHERE email = ?`, [params]);
    }

    async checkRegisterToken(param){
        try {
            return new Promise((resolve, reject) => {

                this.query(`SELECT * FROM matcha.users WHERE registerToken = ?`, [param]).then((result) => {
                    if (result && result[0] && result[0].registerToken === param && result[0].active === 0) {
                        this.query("UPDATE matcha.users SET `registerToken` = 'NULL', `active` = 1 WHERE users.registerToken = ?", [param]);
                        resolve(
                            this.query(`SELECT username, password, id, email FROM matcha.users WHERE id = ?`, [result[0].id])
                        );
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

    async updateInfoWithPass(param, id){
        try {
            bcrypt.hash(param.newPassword, saltRounds, (err, hash) => {
                const sql = "UPDATE matcha.users SET `firstname` = ?, lastname = ?, email = ?, username = ?, `birth` = str_to_date(?, '%d/%m/%Y'), password = ? WHERE id = ?";
                this.query(sql, [param.firstname, param.lastname, param.email, param.username, param.birthdate, hash, id],
                    function (error, results, fields) { if (error) throw error; });
            });
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async updateInfoWithoutPass(param, id){
        const sql = "UPDATE matcha.users SET `firstname` = ?, lastname = ?, email = ?, username = ?, `birth` = str_to_date(?, '%d/%m/%Y') WHERE id = ?";
            return await this.query(sql, [param.firstname, param.lastname, param.email, param.username, param.birthdate, id]);
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

    async getAllUsers(filter, sort){
        try {
            return new Promise((resolve, reject) => {
                if (sort){
                    var sql = "SELECT *, DATE_FORMAT(birth, '%d/%m/%Y') AS birth FROM matcha.users WHERE registerToken = 'NULL'"+filter+sort;
                } else {
                    var sql = "SELECT *, DATE_FORMAT(birth, '%d/%m/%Y') AS birth FROM matcha.users WHERE registerToken = 'NULL'"+filter;
                }
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

    async setOrientation(params){
		try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT orientation, gender FROM matcha.users WHERE id = ?";
                this.query(sql, params).then((pref) => {
                    if (pref[0]['orientation'] == "Hétérosexuel"){
						if (pref[0]['gender'] == "Femme"){
							// console.log("----- 1 -----");
							resolve("AND `gender` = \"Homme\" AND `orientation` != \"Homosexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							// console.log("----- 2 -----");
							resolve("AND `gender` = \"Femme\" AND `orientation` != \"Homosexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							// console.log("----- 3 -----");
							resolve("AND `gender` = \"Homme\" AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							// console.log("----- 4 -----");
							resolve("AND `gender` = \"Femme\" AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else {
							// console.log("----- 5 -----");
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Homosexuel"){
						if (pref[0]['gender'] == "Femme"){
							// console.log("----- 6 -----");
							resolve("AND `gender` = \"Femme\" AND `orientation` != \"Hétérosexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							// console.log("----- 7 -----");
							resolve("AND `gender` = \"Homme\" AND `orientation` != \"Hétérosexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							// console.log("----- 8 -----");
							resolve("AND `gender` = \"Femme\" AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							// console.log("----- 9 -----");
							resolve("AND `gender` = \"Homme\" AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else {
							// console.log("----- 10 -----");
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Bisexuel"){
						if (pref[0]['gender'] == "Femme"){
							// console.log("----- 11 -----");
							resolve("AND ((`gender` = \"Femme\" AND `orientation` != \"Hétérosexuel\") OR (`gender` = \"Homme\" AND `orientation` != \"Homosexuel\")) AND id !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							// console.log("----- 12 -----");
							resolve("AND ((`gender` = \"Homme\" AND `orientation` != \"Hétérosexuel\") OR (`gender` = \"Femme\" AND `orientation` != \"Homosexuel\")) AND id !="+params);						
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							// console.log("----- 13 -----");
							resolve("AND (`gender` = \"Femme\" OR `gender` = \"Homme\") AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							// console.log("----- 14 -----");
							resolve("AND (`gender` = \"Femme\" OR `gender` = \"Homme\") AND `orientation` = \"Pansexuel\" AND id !="+params);						
						} else {
							// console.log("----- 15 -----");
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Pansexuel") {
						if (pref[0]['gender'] == "Femme"){
							// console.log("----- 16 -----");
							resolve("AND (((`gender` = \"Femme\" OR `gender` = \"Femme\-Transgenre\") AND `orientation` != \"Hétérosexuel\") OR ((`gender` = \"Homme\" OR `gender` = \"Homme\-Transgenre\") AND `orientation` != \"Homosexuel\")) AND id !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							// console.log("----- 17 -----");
							resolve("AND (((`gender` = \"Femme\" OR `gender` = \"Femme\-Transgenre\") AND `orientation` != \"Homosexuel\") OR ((`gender` = \"Homme\" OR `gender` = \"Homme\-Transgenre\") AND `orientation` != \"Hétérosexuel\")) AND id !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							// console.log("----- 18 -----");
							resolve("AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							// console.log("----- 19 -----");
							resolve("AND `orientation` = \"Pansexuel\" AND id !="+params);
						} else {
							// console.log("----- 20 -----");
							reject('no gender found');
						}
					} else {
                        reject('no orientation found');
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
                        resolve(tags);
                    } else {
                        reject(tags);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getLikes(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.likes WHERE user_id = ? OR user_liked = ?";
                this.query(sql, [params, params]).then((likes) => {
                    if (likes){
                        resolve(likes);
                    } else {
                        reject(likes);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    // async getMatches(params){
    //     try {
    //         return new Promise((resolve, reject) => {
    //             const sql = "SELECT * FROM matcha.likes WHERE user_id = ? OR user_liked = ?";
    //             this.query(sql, [params, params]).then((likes) => {
    //                 if (likes){
    //                     resolve(likes);
    //                 } else {
    //                     reject(likes);
    //                 }
    //             });
    //         });
    //     } catch (error){
    //         console.log(error);
    //         return false;
    //     }
    // }

}

module.exports = DatabaseRequest;