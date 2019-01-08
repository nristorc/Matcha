const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');

const str = require('../models/str');
const fs = require('fs');
const hogan = require('hogan.js');
const random = new str();
const ipstack = require('ipstack');

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

    async updateOnlineStatus(userId, status){
        try {
            return new Promise((resolve, reject) => {
                if (status === 'login') {
                    this.query(`UPDATE matcha.users SET online = ? WHERE id = ?`, ['Y', userId]).then((result) => {
                        if (result) {
                            resolve();
                        } else {
                            reject();
                        }
                    }).catch((err) => {
                        throw err;
                    });
                } else if (status === 'logout') {
                    this.query(`UPDATE matcha.users SET online = ?, lastOnline = NOW() WHERE id = ?`, ['N', userId]).then((result) => {
                        if (result) {
                            resolve();
                        } else {
                            reject();
                        }
                    }).catch((err) => {
                        throw err;
                    });
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async loginUser(params){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT password FROM matcha.users WHERE username = ?", [params.username]).then((hash) => {
                    if (hash && hash[0] && hash[0].password) {
                        bcrypt.compare(params.password, hash[0].password, (err, res) => {
                            if (res === true) {
                                resolve(this.query(`SELECT id, email, username FROM matcha.users WHERE LOWER(username) = ? AND password = ?`, [params.username, hash[0].password]));
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
        try {
            return new Promise((resolve, reject) => {

                this.query(`SELECT count(resetToken) as count FROM matcha.users WHERE resetToken = ?`, [params]).then((result) => {
                    if (result && result[0] && result[0].count === 1) {
                        resolve('Reset effectué');
                    } else {
                        reject('Probleme');
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return false;
        }
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

    async updateProfilPic(path, id){
        try {
            return new Promise((resolve, reject) => {
                this.query(`UPDATE matcha.users SET profil = ? WHERE id = ?`, [path, id]).then((result) => {
                    resolve(result);
                }).catch((result) => {
                    reject(result);
                });
            });
        } catch (error) {
            console.log(error);
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
                    from: '"RoooCool Admin" <nina.ristorcelli@gmail.com>',
                    to: params['email'],
                    subject: 'Confirmez votre compte sur le site RoooCool',
                    // text: 'Hello world?', // plain text body
                    html: compiledTemplate.render({username: params['username'], registerToken: registerToken})
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
                const template = fs.readFileSync('views/pages/resetPasswordEmail.ejs', 'utf-8');
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
                to: params, // list of receivers
                subject: 'Réinitialisation de votre mot de passe RoooCool', // Subject line
                //text: 'Hello world?', // plain text body
                html: compiledTemplate.render({resetToken: resetToken})
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

    async newActivationEmail (params) {
        try {
            this.query('SELECT username, registerToken FROM matcha.users WHERE email = ?', [params]).then((result) => {
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
                    to: params, // list of receivers
                    subject: 'Confirm your Registration to Matcha website', // Subject line
                    // text: 'Hello world?', // plain text body
                    html: compiledTemplate.render({username: result[0].username, registerToken: result[0].registerToken}) // render template
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                });
                return true;
            }).catch((err) => {
                console.log('error on sending activation email again: ', err);
            });
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

    async insertPhoto(id, path) {
        const sql = "INSERT INTO matcha.photos (user_id, photo) VALUES (?, ?)";
        return await this.query(sql, [id, path]);
    }

    async insertTag(id, tag, size) {
        try {
            return new Promise((resolve, reject) => {
                if (tag.length > size) {
                    reject('Le tag renseigné est trop long');
                } else {
                    const sql = "INSERT INTO matcha.tags (user_id, tag) VALUES (?, lower(?))";
                    this.query(sql, [id, tag]).then(() => {
                        resolve();
                    }).catch(() => {
                        reject("Une erreur s'est produite, merci de réessayer ultérieurement");
                    })
                }
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async deletePhoto(id, path) {
        const sql = "DELETE FROM matcha.photos WHERE user_id = ? AND photo = ?";
        return await this.query(sql, [id, path]);
    }

    async deleteTag(id, tag) {
        const sql = "DELETE FROM matcha.tags WHERE user_id = ? AND tag = ?";
        return await this.query(sql, [id, tag]);
    }

    async checkProfilPic(params) {
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT profil FROM matcha.users WHERE id = ?";
                this.query(sql, [params]).then((profil) => {
                    if (profil && profil[0] && profil[0].profil === '/public/img/avatarDefault.png'){
                        resolve({picture: profil[0].profil, flag: 0});
                    } else if (profil && profil[0] && profil[0].profil !== '/public/img/avatarDefault.png') {
                        resolve({picture: profil[0].profil, flag: 1});
                    } else {
                        reject({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement"});
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    getUser(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.users WHERE id = ?";
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

    async getPosition(user_id){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT `users`.`latitude`, `users`.`longitude` FROM matcha.users WHERE id = ?";
                this.query(sql, user_id).then((position) => {
                    if (position){
                        resolve(position);
                    } else {
                        reject('no position found');
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

// -------------------------ALGO PONDERE-------------------------
    // SELECT *, COUNT(`tmp`.`id`), 
    // (6371 * ACOS(COS(RADIANS(48.792001)) * COS(RADIANS(`latitude`)) * COS(RADIANS(`longitude`) - RADIANS(2.3985099999999875)) + SIN(RADIANS(48.792001)) * SIN(RADIANS(`latitude`)))) AS `loc`, 
    // (1000 / LN((6371 * ACOS(COS(RADIANS(48.792001)) * COS(RADIANS(`latitude`)) * COS(RADIANS(`longitude`) - RADIANS(2.3985099999999875)) + SIN(RADIANS(48.792001)) * SIN(RADIANS(`latitude`)))) + 1.1) + COUNT(`tmp`.`id`) * 1000 + (`popularity` + 100)) AS 'score' FROM (
    //     SELECT `users`.* 
    //     FROM matcha.users 
    //     WHERE registerToken = 'NULL' 
    //     AND (((`gender` = "Femme" OR `gender` = "Femme-Transgenre") AND `orientation` != "Heterosexuel") OR ((`gender` = "Homme" OR `gender` = "Homme-Transgenre") AND `orientation` != "Homosexuel"))
    //     AND `users`.`id` !=1 AND `users`.`id` !=3 AND `users`.`id` !=2
        
    //     UNION ALL 
        
    //     SELECT `users`.* 
    //     FROM `matcha`.`users` INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` WHERE (`tags`.`tag` = "cacahouete") AND registerToken = 'NULL' AND (((`gender` = "Femme" OR `gender` = "Femme-Transgenre") AND `orientation` != "Heterosexuel") OR ((`gender` = "Homme" OR `gender` = "Homme-Transgenre") AND `orientation` != "Homosexuel"))
    //     AND `users`.`id` !=1 
        
    // ) AS `tmp` 
    // GROUP BY `tmp`.`id`, `tmp`.`email`, `tmp`.`firstname`, `tmp`.`lastname`, `tmp`.`username`, `tmp`.`password`, `tmp`.`created_at`, `tmp`.`registerToken`, `tmp`.`active`, `tmp`.`resetToken`, `tmp`.`reset_at`, `tmp`.`birth`, `tmp`.`gender`, `tmp`.`orientation`, `tmp`.`description`, `tmp`.`popularity`, `tmp`.`profil`, `tmp`.`online`, `tmp`.`lastOnline`, `tmp`.`city`, `tmp`.`latitude`, `tmp`.`longitude`, `tmp`.`changed_loc`
    // ORDER BY `score` DESC

    async getAllUsers(orientation, filter, sort, tags, user_tags, user_position, reports){
        try {
            return new Promise((resolve, reject) => {
                var location = "";
                location = "(6371 * ACOS(COS(RADIANS(" + user_position[0].latitude + ")) * COS(RADIANS(`latitude`)) * COS(RADIANS(`longitude`) - RADIANS("+user_position[0].longitude+")) + SIN(RADIANS("+user_position[0].latitude+")) * SIN(RADIANS(`latitude`))))";
                var block = "";
                for (var r=0; r < reports.length; r++){
                    block = block.concat(" AND `users`.`id` != " + reports[r].reported_id);
                }
				var sql;
				var secretSauce = "(1000 / LN(" + location + "+ 1.1) + COUNT(`tmp`.`id`) * 1000 + (`popularity` + 100))";
				var groupBy = " GROUP BY `tmp`.`id`, `tmp`.`email`, `tmp`.`firstname`, `tmp`.`lastname`, `tmp`.`username`, `tmp`.`password`, `tmp`.`created_at`, `tmp`.`registerToken`, `tmp`.`active`, `tmp`.`resetToken`, `tmp`.`reset_at`, `tmp`.`birth`, `tmp`.`gender`, `tmp`.`orientation`, `tmp`.`description`, `tmp`.`popularity`, `tmp`.`profil`, `tmp`.`online`, `tmp`.`lastOnline`, `tmp`.`city`, `tmp`.`latitude`, `tmp`.`longitude`, `tmp`.`changed_loc` ";
		// ---------- structure de requete generique ----------

					// SELECT *, COUNT(`tmp`.`id`) FROM (
					//     SELECT `users`.*
					//             FROM matcha.users
					//             WHERE registerToken = 'NULL' 
					//             AND // ORIENTATION
					//             AND `users`.`id` != //ID USER 
					//             AND // FILTER
					//     UNION ALL
					//     SELECT `users`.*
					//         FROM matcha.users
					//         INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` 
					//         WHERE `tags`.`tag` = // (TAG 1 USER OR TAG 2 USER [..])
					//         AND registerToken = 'NULL' 
					//         AND //ORIENTATION 
					//         AND `users`.`id` != //ID USER
					//         AND //FILTER
					// ) AS `tmp`
					// GROUP BY `tmp`.`id`, `tmp`.`email`, `tmp`.`firstname`, `tmp`.`lastname`, `tmp`.`username`, `tmp`.`password`, `tmp`.`created_at`, `tmp`.`registerToken`, `tmp`.`active`, `tmp`.`resetToken`, `tmp`.`reset_at`, `tmp`.`birth`, `tmp`.`gender`, `tmp`.`orientation`, `tmp`.`description`, `tmp`.`popularity`, `tmp`.`profil`
					// ORDER BY COUNT(`tmp`.`id`) DESC, //SORT THEN SECRET SAUCE

		// -------------------------------------------------------
			if (!tags){
                sql = "SELECT *, COUNT(`tmp`.`id`), " + location + " AS `loc`," + secretSauce + " AS 'score' FROM (SELECT `users`.* FROM matcha.users WHERE registerToken = 'NULL' ";
				if (orientation){
                    sql = sql.concat(orientation + block);
					if (filter){
						sql = sql.concat(filter);
					}
				}
				sql = sql.concat(" UNION ALL SELECT `users`.* FROM `matcha`.`users` INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` WHERE ");
				if (user_tags){
					for (var i=0; i < user_tags.length; i++){
                        if (user_tags.length == 1){
							sql = sql.concat("(`tags`.`tag` = \"" + user_tags[i].tag + "\") AND ");
                        }
						else if (i == 0){
							sql = sql.concat("(`tags`.`tag` = \"" + user_tags[i].tag + "\"");
						} else if (i < user_tags.length - 1){
							sql = sql.concat(" OR `tags`.`tag` = \"" + user_tags[i].tag + "\"");
						} else {
							sql = sql.concat(" OR `tags`.`tag` = \"" + user_tags[i].tag + "\") AND ");
						}
					}
				}
				if (orientation){
					sql = sql.concat("registerToken = 'NULL' " + orientation + block);
					if (filter){
						sql = sql.concat(filter);
					}
				}
			}
		// ---------- structure de requete avec tag ----------

					// SELECT *, COUNT(`tmp`.`id`) FROM (
					//     SELECT `users`.*
					//         FROM matcha.users
					//         INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` 
					//         WHERE `tags`.`tag` = //TAG CHERCHÉ
					//         AND registerToken = 'NULL' 
					//         AND //ORIENTATION 
					//         AND `users`.`id` != //ID USER
					//         AND //FILTER
					// ) AS `tmp`
					// GROUP BY `tmp`.`id`, `tmp`.`email`, `tmp`.`firstname`, `tmp`.`lastname`, `tmp`.`username`, `tmp`.`password`, `tmp`.`created_at`, `tmp`.`registerToken`, `tmp`.`active`, `tmp`.`resetToken`, `tmp`.`reset_at`, `tmp`.`birth`, `tmp`.`gender`, `tmp`.`orientation`, `tmp`.`description`, `tmp`.`popularity`, `tmp`.`profil`
					// ORDER BY COUNT(`tmp`.`id`) DESC, //SORT THEN SECRET SAUCE

           		// ---------- structure de requete avec tag filtré par tags en commun ----------

                            // SELECT *, COUNT(`tmp`.`id`) FROM (
                            //   SELECT `users`.* 
                            //      FROM matcha.users 
                            //      INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` 
                            //      WHERE `tags`.`tag` = //TAG CHERCHÉ
                            //      AND registerToken = 'NULL'
                            //      AND //ORIENTATION  
                            //      AND `users`.`id` != //ID USER 
                            //      AND //FILTER 
                            // UNION ALL
                            //   SELECT `g`.*
                            //      FROM (
                            //          SELECT `users`.* 
                            //          FROM matcha.users 
                            //          INNER JOIN matcha.tags ON `users`.`id` = `tags`.`user_id` 
                            //          WHERE `tags`.`tag` = //TAG CHERCHÉ 
                            //          AND registerToken = 'NULL'
                            //          AND //ORIENTATION  
                            //          AND `users`.`id` != //ID USER 
                            //          AND //FILTER
                            //      ) AS `g`
                            //      INNER JOIN matcha.tags ON `g`.`id` = `tags`.`user_id` 
                            //      WHERE `tags`.`tag` = // (TAG 1 USER OR TAG 2 USER [..])
                            //  ) AS `tmp` 
                            // GROUP BY `tmp`.`id`, `tmp`.`email`, `tmp`.`firstname`, `tmp`.`lastname`, `tmp`.`username`, `tmp`.`password`, `tmp`.`created_at`, `tmp`.`registerToken`, `tmp`.`active`, `tmp`.`resetToken`, `tmp`.`reset_at`, `tmp`.`birth`, `tmp`.`gender`, `tmp`.`orientation`, `tmp`.`description`, `tmp`.`popularity`, `tmp`.`profil` 
                            // ORDER BY COUNT(`tmp`.`id`) DESC, //SORT THEN SECRET SAUCE

        // -------------------------------------------------------
			else if (tags){
				sql = "SELECT *, COUNT(`tmp`.`id`), " + location + " AS `loc`," + secretSauce + " AS 'score' FROM (SELECT `users`.* FROM matcha.users" + tags + "AND registerToken = 'NULL' ";
				if (orientation){
					sql = sql.concat(orientation + block);
					if (filter){
						sql = sql.concat(filter);
					}
                }
                if (sort == "tag"){
					sql = sql.concat(" UNION ALL SELECT `g`.* FROM (SELECT `users`.* FROM matcha.users" + tags + "AND registerToken = 'NULL' ");
					if (orientation){
						sql = sql.concat(orientation + block);
						if (filter){
							sql = sql.concat(filter);
						}
					}
					sql = sql.concat(") AS `g` INNER JOIN matcha.tags ON `g`.`id` = `tags`.`user_id` WHERE");
					if (user_tags){
                        for (var i=0; i < user_tags.length; i++){
                            if (user_tags.length == 1){
                                sql = sql.concat("(`tags`.`tag` = \"" + user_tags[i].tag + "\" )");
                            }
                            else if (i == 0){
                                sql = sql.concat("(`tags`.`tag` = \"" + user_tags[i].tag + "\"");
                            } else if (i < user_tags.length - 1) {
                                sql = sql.concat(" OR `tags`.`tag` = \"" + user_tags[i].tag + "\" ");
                            } else {
                                sql = sql.concat(" OR `tags`.`tag` = \"" + user_tags[i].tag + "\") ");
                            }
                        }
					}
                }
            }
			sql = sql.concat(" ) AS `tmp`" + groupBy + "ORDER BY ");
			if (sort && sort != "tag"){
				sql = sql.concat(sort + ", ");
			}
            sql = sql.concat(" `score` DESC");

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
                const sql = "SELECT orientation, gender FROM matcha.users WHERE `users`.`id` = ?";
                this.query(sql, params).then((pref) => {
                    if (pref[0]['orientation'] == "Heterosexuel"){
						if (pref[0]['gender'] == "Femme"){
							resolve("AND `gender` = \"Homme\" AND `orientation` != \"Homosexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							resolve("AND `gender` = \"Femme\" AND `orientation` != \"Homosexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							resolve("AND `gender` = \"Homme\" AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							resolve("AND `gender` = \"Femme\" AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else {
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Homosexuel"){
						if (pref[0]['gender'] == "Femme"){
							resolve("AND `gender` = \"Femme\" AND `orientation` != \"Heterosexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							resolve("AND `gender` = \"Homme\" AND `orientation` != \"Heterosexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							resolve("AND `gender` = \"Femme\" AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							resolve("AND `gender` = \"Homme\" AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else {
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Bisexuel"){
						if (pref[0]['gender'] == "Femme"){
							resolve("AND ((`gender` = \"Femme\" AND `orientation` != \"Heterosexuel\") OR (`gender` = \"Homme\" AND `orientation` != \"Homosexuel\")) AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							resolve("AND ((`gender` = \"Homme\" AND `orientation` != \"Heterosexuel\") OR (`gender` = \"Femme\" AND `orientation` != \"Homosexuel\")) AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							resolve("AND (`gender` = \"Femme\" OR `gender` = \"Homme\") AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							resolve("AND (`gender` = \"Femme\" OR `gender` = \"Homme\") AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);						
						} else {
							reject('no gender found');
						}
					} else if (pref[0]['orientation'] == "Pansexuel") {
						if (pref[0]['gender'] == "Femme"){
							resolve("AND (((`gender` = \"Femme\" OR `gender` = \"Femme\-Transgenre\") AND `orientation` != \"Heterosexuel\") OR ((`gender` = \"Homme\" OR `gender` = \"Homme\-Transgenre\") AND `orientation` != \"Homosexuel\")) AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme") {
							resolve("AND (((`gender` = \"Femme\" OR `gender` = \"Femme\-Transgenre\") AND `orientation` != \"Homosexuel\") OR ((`gender` = \"Homme\" OR `gender` = \"Homme\-Transgenre\") AND `orientation` != \"Heterosexuel\")) AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Femme-Transgenre") {
							resolve("AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else if (pref[0]['gender'] == "Homme-Transgenre") {
							resolve("AND `orientation` = \"Pansexuel\" AND `users`.`id` !="+params);
						} else {
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

    async getPhotos(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.photos WHERE user_id = ? ORDER BY id DESC";
                this.query(sql, params).then((photos) => {
                    if (photos){
                        resolve(photos);
                    } else {
                        reject(photos);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getUserPic(params) {
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT `profil` FROM matcha.users WHERE id = ?";
                this.query(sql, params).then((photos) => {
                    if (photos.length > 0 && photos[0].profil !== '/public/img/avatarDefault.png'){
                        resolve(photos);
                    } else {
                        reject(photos);
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

    async getMyReports(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.reports WHERE report_id = ?";
                this.query(sql, [params, params]).then((reports) => {
                    if (reports){
                        resolve(reports);
                    } else {
                        reject(reports);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async igotBlockedBy(reported, report){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.reports WHERE (reported_id = ? AND report_id = ? AND flag = 2)";
                this.query(sql, [reported, report]).then((reports) => {
                    if (reports){
                        resolve(reports);
                    } else {
                        reject(reports);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getMyBlocks(params){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.reports WHERE report_id = ? and flag = ?";
                this.query(sql, [params, 2]).then((reports) => {
                    if (reports){
                        resolve(reports);
                    } else {
                        reject(reports);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    getSpecificMatch(iLike, userLiked) {
        try {
            return new Promise((resolve, reject) => {

                const sql = 'SELECT user_id, user_liked FROM matcha.likes WHERE (user_id = ? AND user_liked = ?) OR (user_id = ? AND user_liked = ?)';
                this.query(sql, [iLike, userLiked, userLiked, iLike]).then((exist) => {
                    if (exist && exist[0] && exist[1]) {
                        resolve();
                    } else {
                        reject();
                    }
                }).catch((exist)=> {
                    console.log('catch existe', exist)
                    return(false);
                });
            })
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    getMatches(user_id){
        try{
            return new Promise ((resolve, reject) => {
                this.getLikes(user_id).then((likes) => {
                    var i = 0;
                    var x = 0;
                    var z = 0;
                    var matches = [];
                    while (likes[i]){
                        if (likes[i].user_liked == user_id){
                            while (likes[z]){
                                if (likes[i].user_id == likes[z].user_liked){
                                    matches[x] = likes[i].user_id;
                                    x++;
                                }
                                z++;
                            }
                            z = 0;
                        }
                        i++;
                    }
                    resolve(matches);
                }).catch((error) => {
                    console.log(error);
                    return false;
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    async getMessages(from, to){
        try {
            return new Promise((resolve, reject) => {
                const sql = "SELECT * FROM matcha.messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)";
                this.query(sql, [from, to, to, from]).then((messages) => {
                    if (messages){
                        resolve(messages);
                    } else {
                        reject(messages);
                    }
                });
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }

    updatePop(user_id, flag){ 
		// Flag 1 : like
		// Flag 2 : unlike
		// Flag 3 : block
		// Flag 4 : report
        // Flag 5 : unblock
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT * FROM matcha.users WHERE `id` = ?", [user_id]).then((score) => {
                    var newpop = score[0].popularity;
					if (flag == 1) {
						if (newpop < 50 && newpop > -50) {
							newpop += 10;
						} else if (newpop < 80 && newpop > -80) {
							newpop += 5;
						} else if (newpop < 99 && newpop >= -100) {
							newpop += 2;
						}
					} else if (flag == 2) {
						if (newpop < 50 && newpop > -50) {
							newpop -= 10;
						} else if (newpop < 80 && newpop > -80) {
							newpop -= 5;
						} else if (newpop <= 100 && newpop > -99) {
							newpop -= 2;
						}
                    } else if (flag == 3){
                        newpop -= 15;
                    } else if (flag == 4){
                        newpop -= 50;
                    } else if (flag == 5){
					    newpop += 15;
                    }
                    if (newpop < -100){
                        newpop = -100;
                    }
                    if (newpop > 100){
                        newpop = 100;
                    }
					this.query("UPDATE matcha.users SET `popularity`= ? WHERE `id` = ?", [newpop, user_id]).then(() => {
                        resolve(newpop);
					}).catch(() => {
						reject(score);
					});
			}).catch((score) => {
				reject(score);
			});
		});
        } catch (error){
            console.log(error);
            return false;
        }
	}

	async updateNotifications(fromUser, toUser, flag) {
        try {
            return new Promise((resolve, reject) => {
                this.query("INSERT INTO matcha.notifications SET `from` = ?, `to` = ?, `flag` = ?, `date` = NOW()",
                    [fromUser, toUser, flag]).then((result) => {
                        if (result) {
                            resolve();
                        } else {
                            reject();
                        }
                }).catch((err)=> {
                    console.log('catch update notifications', err);
                    return(false);
                });
            })
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    updateLikes(user_id, id, bool){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT `user_id` FROM matcha.likes WHERE `user_id` = ? AND user_liked = ?", [user_id, id]).then((exist) => {
                    if (exist == ""){
                        if (bool == 1){
                            this.updateNotifications(user_id, id, 1).then(() => {
                                this.query("INSERT INTO matcha.likes(`user_id`, `user_liked`, `liked_at`) VALUES (?, ?, NOW())", [user_id, id]).then(() => {
                                    this.getSpecificMatch(user_id, id).then(() => {
                                        this.updateNotifications(user_id, id, 2).then(() => {
                                            this.updatePop(id, 1).then((newpop) => {
                                                resolve(newpop);
                                            }).catch((err) => {
                                                console.log(err);
                                            });
                                        }).catch((err) => {
                                            console.log('update notif avec match: ', err);
                                        });
                                    }).catch(() => {
                                        this.updatePop(id, 1).then((newpop) => {
                                            resolve(newpop);
                                        }).catch((err) => {
                                            console.log(err);
                                        });
                                    });
                                }).catch(() => {
                                    reject();
                                });
                            }).catch(() => {
                                reject();
                            });
                        } else if (bool == -1) {
                            reject();
                        }
                    } else {
                        if (bool == 1){
                            reject();
                        } else if (bool == -1) {
                            this.updateNotifications(user_id, id, 3).then(() => {
                                this.getSpecificMatch(user_id, id).then(() => {
                                        this.updateNotifications(user_id, id, 4).then(() => {
                                            this.query("DELETE FROM matcha.likes WHERE `user_id` = ? AND `user_liked` = ?", [user_id, id]).then(() => {
                                                this.updatePop(id, 2).then((newpop) => {
                                                    resolve(newpop);
                                                }).catch((err) => {
                                                    console.log(err);
                                                });
                                            }).catch(() => {
                                                reject();
                                            });
                                        }).catch((err) => {
                                            console.log('error while unmatch notification: ', err);
                                        })
                                }).catch((err) => {
                                    this.query("DELETE FROM matcha.likes WHERE `user_id` = ? AND `user_liked` = ?", [user_id, id]).then(() => {
                                        this.updatePop(id, 2).then((newpop) => {
                                            resolve(newpop);
                                        }).catch((err) => {
                                            console.log(err);
                                        });
                                    }).catch(() => {
                                        reject();
                                    });
                                });
                            }).catch(() => {
                                reject();
                            });
                        }
                    }
                }).catch((exist)=> {
                    console.log('catch existe', exist);
                    return(false);
                });
            })
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async updateReports(id, reported, flag){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT `report_id` FROM matcha.reports WHERE `report_id` = ? AND reported_id = ? AND flag = ?", [id, reported, flag]).then((exist) => {
                    if (exist == ""){
                        if (flag == 1){
                            this.query("INSERT INTO matcha.reports(`report_id`, `reported_id`, `reported_at`, `flag`) VALUES (?, ?, NOW(), ?)", [id, reported, flag]).then(() => {
                                this.updatePop(reported, 4).then(() => {
                                    resolve();
                                }).catch((err) => {
                                    console.log(err);
                                });
                            }).catch(() => {
                                reject();
                            });
                        } else if (flag == 2) {
                            this.query("INSERT INTO matcha.reports(`report_id`, `reported_id`, `reported_at`, `flag`) VALUES (?, ?, NOW(), ?)", [id, reported, flag]).then(() => {
                                this.updatePop(reported, 3).then(() => {
                                    resolve();
                                }).catch((err) => {
                                    console.log(err);
                                });
                            }).catch(() => {
                                reject();
                            });
                        }
                    } else {
                            reject();
                    }
                }).catch((exist)=> {
                    console.log('catch existe', exist);
                    return(false);
                });
            })
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async deleteReports(id, unblocked){
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT `report_id` FROM matcha.reports WHERE `report_id` = ? AND reported_id = ?", [id, unblocked]).then((exist) => {
                    if (exist != ""){
                            this.query("DELETE FROM matcha.reports WHERE report_id = ? AND reported_id = ? AND flag = 2", [id, unblocked]).then(() => {
                                this.updatePop(unblocked, 5).then(() => {
                                    resolve();
                                }).catch((err) => {
                                    console.log(err);
                                });
                            }).catch(() => {
                                reject();
                            });
                    } else {
                        reject();
                    }
                }).catch((exist)=> {
                    console.log('catch existe', exist)
                    return(false);
                });
            })
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async profilCompleted(id) {
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT birth, gender, orientation, description FROM matcha.users WHERE `id` = ?", [id]).then((result) => {
                    if (result) {
                        const userInfo = result[0];
                        if (!userInfo.birth || !userInfo.gender || !userInfo.orientation || !userInfo.description) {
                            reject('pas complet');
                        }
                        resolve('complet');
                    }
                }).catch((result) => {
                    console.log('catch', result);
                })
            });
        }
         catch (error) {
            console.log(error);
            return false;
        }
    }

    async forceGeo(ip, user_id) {
        try {
            return new Promise((resolve, reject) => {
                this.query("SELECT `changed_loc` FROM matcha.users WHERE `id` = ?", [user_id]).then((loc) => {
					if (loc[0].changed_loc == "E"){
					    ipstack(ip,"31f49d56e09d0468b0ac0349dfdb75fe",(err, response) => {
					        const sql = "UPDATE matcha.users SET `latitude` = ?, `longitude` = ?, `changed_loc` = ? WHERE users.id = ?";
					        this.query(sql, [response.latitude, response.longitude, "E", user_id]).then(() => {
					        });
					    });
					}
                }).catch((err) => {
					console.log(err);
				});
            });
        }
         catch (error) {
            console.log(error);
            return false;
        }
    }

    async emailReport (reportUser, reportedUser) {
        try {
            this.query("SELECT id, username FROM matcha.users WHERE id = ? OR id = ?",
                [reportUser, reportedUser]).then((result) => {
                    if (result && result[0] != '' && result[1] != '') {
                        const template = fs.readFileSync('views/pages/reportEmail.ejs', 'utf-8');
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

                        if (result[0].id === reportUser) {
                            var mailOptions = {
                                from: '"Reporting a User" <nina.ristorcelli@gmail.com>',
                                to: 'nina.ristorcelli@gmail.com',
                                subject: 'Un faux compte a été détecté',
                                html: compiledTemplate.render({reportUser: result[0].username, reportedUser: result[1].username, clickLink: result[1].id})
                            };
                        } else if (result[1].id === reportUser) {
                            var mailOptions = {
                                from: '"Reporting a User" <nina.ristorcelli@gmail.com>',
                                to: 'nina.ristorcelli@gmail.com',
                                subject: 'Un faux compte a été détecté',
                                html: compiledTemplate.render({reportUser: result[1].username, reportedUser: result[0].username, clickLink: result[0].id})
                            };
                        }

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);
                        });
                        return true;
                    }
            });
        } catch (error){
            console.log(error);
            return false;
        }
    }
}

module.exports = DatabaseRequest;