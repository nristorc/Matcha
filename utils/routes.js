'use strict';

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();

const userDatabase =require('../models/userData');
const userData = new userDatabase();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (request, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function(request, file, callback) {
        checkFileType(file, callback);
    }
}).single('inputFile');

function checkFileType(file, callback) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({message: "Image corrompue !"});
    }
}

class Routes{
    constructor(app){
        this.app = app;
    }

    appRoutes(){
        this.app.get('/', async (request,response) => {
            console.log("Je suis dans INDEX");
            if (!request.session.user) {
                //console.log('session KO: ', request.session);
                response.status(200).render('index');
            } else {
                //console.log('session OK: ', request.session);
                console.log(request.session.user);
                response.status(200).redirect('/profil');
            }
        });

        /* Routes for Authentication */

        this.app.post('/login', async (request, response)=> {
            const loginResponse = {};
            const data = {
                username: request.body.username,
                password: request.body.password,
            };
            if ((data.username === '' || data.username === null) && (data.password === '' || data.password === null)) {
                loginResponse.error = true;
                loginResponse.type = 'warning';
                loginResponse.message = `fields cannot be empty`;
                request.flash(loginResponse.type, loginResponse.message);
                response.status(412).redirect('/');
            } else if (data.username === '' || data.username === null) {
                loginResponse.error = true;
                loginResponse.type = 'warning';
                loginResponse.message = `username cant be empty.`;
                request.flash(loginResponse.type, loginResponse.message);
                response.status(412).redirect('/');
            } else if(data.password === '' || data.password === null){
                loginResponse.error = true;
                loginResponse.type = 'warning';
                loginResponse.message = `password cant be empty.`;
                request.flash(loginResponse.type, loginResponse.message);
                response.status(412).redirect('/');
            } else {
                checkDb.checkActive(data.username).then(() => {
                    checkDb.loginUser(data).then( (result) => {
                        loginResponse.error = false;
                        loginResponse.type = 'dark';
                        loginResponse.userId = result[0].id;
                        loginResponse.message = `User logged in.`;
                        request.session.user = data;
                        request.session.user.id = result[0].id;
                        request.session.user.email = result[0].email;
                        console.log(request.session.user);
                        request.flash(loginResponse.type, loginResponse.message);
                        response.status(200).redirect('/profil');
                    }).catch((result) => {
                        if (result === undefined || result === false) {
                            loginResponse.error = true;
                            loginResponse.type = 'warning';
                            loginResponse.message = `Invalid username and password combination.`;
                            request.flash(loginResponse.type, loginResponse.message);
                            response.status(401).redirect('/');
                        }
                    });
                }).catch((val) => {
                    loginResponse.error = true;
                    loginResponse.type = 'warning';
                    loginResponse.message = val;
                    request.flash(loginResponse.type, loginResponse.message);
                    response.status(420).redirect('/');
                });
            }
        });

        this.app.post('/register', async (request,response) => {
            console.log("Je suis dans REGISTER");
            const registrationResponse = {};
            const data = {
                lastname: request.body.lastname,
                firstname: request.body.firstname,
                email: request.body.email,
                username : request.body.username,
                password : request.body.password,
                confirmPassword : request.body.confirmPassword,
                active: false
            };

            if(data.lastname === '' || data.firstname === '' ||
                data.email === '' || data.username === '' ||
                data.password === '' || data.confirmPassword === '') {
                registrationResponse.error = true;
                registrationResponse.message = `One of the fields is empty -- ALL MANDATORY`;
                registrationResponse.type = 'warning';
                request.flash(registrationResponse.type, registrationResponse.message);
                response.status(412).redirect('/');
            } else {
                await validation.isName(data.firstname, 'Wrong firstname');
                await validation.isName(data.lastname, 'Wrong lastname');
                await validation.isAlpha(data.username, 'Wrong username');
                await validation.isEmail(data.email, "Wrong Email");
                await validation.isConfirmed(data.password, data.confirmPassword, "Wrong matching password");
                console.log(validation.errors);

                if (validation.errors.length === 0) {

                    const resultUsername  = await checkDb.checkUsername(data.username);
                    const resultEmail = await checkDb.checkEmail(data.email);

                    if (resultUsername[0].count !== 0 && resultEmail[0].count !== 0) {
                        registrationResponse.error = true;
                        registrationResponse.message = `This username and email are already taken.`;
                        registrationResponse.type = 'warning';
                        request.flash(registrationResponse.type, registrationResponse.message);
                        response.status(401).redirect('/');
                    } else if (resultUsername[0].count !== 0 && resultEmail[0].count === 0) {
                        registrationResponse.error = true;
                        registrationResponse.message = `This username is already taken.`;
                        registrationResponse.type = 'warning';
                        request.flash(registrationResponse.type, registrationResponse.message);
                        response.status(401).redirect('/');
                    } else if (resultUsername[0].count === 0 && resultEmail[0].count !== 0) {
                        registrationResponse.error = true;
                        registrationResponse.message = `This email is already taken.`;
                        registrationResponse.type = 'warning';
                        request.flash(registrationResponse.type, registrationResponse.message);
                        response.status(401).redirect('/');
                    }
                    else {
                        //console.log("Je peux ajouter le nouvel utilisateur !! Youpiiii");
                        const result = await checkDb.registerUser(data);
                        //console.log(result);
                        if (result === false) {
                            registrationResponse.type = 'warning';
                            registrationResponse.error = true;
                            registrationResponse.message = `User registration unsuccessful,try after some time.`;
                            request.flash(registrationResponse.type, registrationResponse.message);
                            response.status(417).redirect('/');
                        } else {
                            registrationResponse.error = false;
                            registrationResponse.userId = result.insertId;
                            registrationResponse.type = 'dark';
                            registrationResponse.message = `User registration successful. An email to confirm your registration has been sent to your mailbox`;
                            request.flash(registrationResponse.type, registrationResponse.message);
                            response.status(200).redirect('/');
                        }
                    }
                } else {
                    registrationResponse.type = 'warning';
                    registrationResponse.error = true;
                    registrationResponse.message = `Error fields format... Check which is wrong please`;
                    request.flash(registrationResponse.type, registrationResponse.message);
                    response.status(417).redirect('/');
                    validation.errors = [];
                }
            }
        });

        this.app.post('/resetPassword', async (request, response) => {
            const checkingResponse = {};
            const valid = await validation.isEmail(request.body.checkEmail, "Wrong Email");
            console.log("Email du formulaire ",request.body.checkEmail);
            console.log("Variable Valid: ",valid);
            console.log("Tableau d'erreur: ",validation.errors);
            if (valid && validation.errors !== []) {
                console.log("Le format de l'email est incorrect");
                checkingResponse.error = true;
                checkingResponse.message = `Mauvais format d'email`;
                response.status(417).json(checkingResponse);
                validation.errors = [];
            } else {
                console.log("Format OK, je checke la DB");
                const resultEmail = await checkDb.checkEmail(request.body.checkEmail);
                if (resultEmail[0].count === 0) {
                    console.log("DB: Email non trouvé");
                    response.status(401).json({
                        error:true,
                        message: 'Aucun email correspondant dans la base de données'
                    });
                } else {
                    checkDb.checkActive(request.body.checkEmail).then(() => {
                        console.log('All good, je peux envoyer mon mail de reset');
                        checkDb.resetToken(request.body.checkEmail);
                        response.redirect('/');
                    }).catch(() => {
                        console.log("DB: Compte pas actif");
                        response.status(401).json({
                            error:true,
                            message: "Votre compte n'est pas encore actif..."
                        });
                    });
                }
            }
        });

        this.app.get('/verify/register/:registerToken', async (request, response) => {
            console.log("Jesuis dans VERIFY REGISTER");
            const loginResponse = {};
            checkDb.checkRegisterToken(request.params.registerToken).then((result) => {
                if (result && result !== undefined) {
                    console.log("Then: ", result);
                    const data = {
                        username: result[0].username,
                        password: result[0].password,
                    };
                    loginResponse.error = false;
                    loginResponse.userId = result[0].id;
                    loginResponse.type = 'dark';
                    loginResponse.message = `User logged in.`;
                    request.session.user = data;
                    request.session.user.id = result[0].id;
                    request.session.user.email = result[0].email;
                    console.log('session : ', request.session.user);
                    request.flash(loginResponse.type, loginResponse.message);
                    response.status(200).redirect('/profil');
                    console.log('response then: ', response.status);
                }
            }).catch((result) => {
                console.log("Catch: ", result);
                loginResponse.error = true;
                loginResponse.type = 'warning';
                loginResponse.message = `Token not valid`;
                request.flash(loginResponse.type, loginResponse.message);
                response.status(401).redirect('/');
                console.log('response catch: ', response.status);
            });
        });

        this.app.route('/verify/reset/:resetToken')
            .get((request, response) => {
                checkDb.checkResetToken(request.params.resetToken).then((result) => {
                    if (result[0].count === 0) {
                        response.status(401).json({
                            error:true,
                            message: 'Token invalide...'
                        });
                    } else {
                        response.render('pages/resetPassword', {resetToken: request.params.resetToken});
                        console.log("Je rentre dans GET");
                    }
                }).catch(() => {
                    response.status(417).json("Une erreur s'est produite, merci de bien vouloir reessayer");
                });
            }).post(async (request, response) => {
            console.log("Je rentre dans POST");
            const resetResponse = {};
            const data = {
                resetToken: request.body.resetToken,
                newPassword: request.body.modifyPassword,
                confirmPassword: request.body.modifyPasswordConfirm
            };
            await validation.isConfirmed(data.newPassword, data.confirmPassword, "Wrong matching password");
            console.log(validation.errors);
            if (validation.errors.length === 0) {
                const result = await checkDb.resetPassword(data);
                console.log(result);
                if (result === false) {
                    resetResponse.error = true;
                    resetResponse.message = `Reset password unsuccessful,try after some time.`;
                    response.status(417).json(resetResponse);
                } else {
                    resetResponse.error = false;
                    //resetResponse.userId = result.insertId;
                    resetResponse.message = `Votre mot de passe a bien été modifié`;
                    response.status(200).redirect('/');
                }

            } else {
                resetResponse.error = true;
                resetResponse.message = `Error fields format...`;
                response.status(417).json(resetResponse);
                validation.errors = [];
            }
        });

        /*this.app.get('/loggedIn', (request, response) => {
            console.log('Je suis dans LOGGEDIN');
            //console.log(request.session);
            //console.log(request.session.user);
            if (!request.session.user) {
                //console.log('pas de session');
                return response.status(401).send();
            }
            //console.log('1 session');
            return response.status(200).send('Welcome to your Dashboard !');
        });*/

        this.app.get('/logout', function(request, result){
            console.log("Je suis dans LOGOUT");
            let cookie = request.cookies;
            for (let prop in cookie) {
                if (!cookie.hasOwnProperty(prop)) {
                    continue;
                }
                result.cookie(prop, '', {expires: new Date(0)});
                request.session = null;
            }
            result.redirect('/');
        });

        /* Routes for Profil */

        this.app.route('/profil').get((request, response) => {
            if (!request.session.user) {
                return response.render('index');
			}
			checkDb.getUser(request.session.user.username).then((user) => {
				checkDb.getTags(request.session.user.id).then((tags) => {
					//console.log(tags);
					userData.userAge(user[0]['birth']).then((age) => {
					    //console.log('thne', age);
						response.render('pages/profil', {
						user: user,
						userage: age,
						usertags: tags
						});
					}).catch((age) => {
                        //console.log('catch', age);
						response.render('pages/profil', {
						user: user,
						usertags: tags,
						userage: null
						});
					});
				});
			});
        }).post(async (request, response) => {
            if (request.body.submit === 'modifyParams') {
                const data = {
                    firstname: request.body.firstname,
                    lastname: request.body.lastname,
                    email: request.body.email,
                    username: request.body.username,
                    birthdate: request.body.birthdate,
                    currentPassword: request.body.currentPassword,
                    newPassword: request.body.newPassword,
                    confirmPassword: request.body.confirmNewPass
                };

                await validation.isName(data.firstname, "Mauvais format de prénom");
                await validation.isName(data.lastname, "Mauvais format de nom de Famille");
                await validation.isEmail(data.email, "Mauvais format d'email");
                await validation.isAlpha(data.username, "Mauvais format d'identifiant");
                await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de date de naissance");


                if (data.currentPassword !== '' || data.newPassword !== '' || data.confirmPassword !== '') {
                    await checkDb.checkPassword(data, request.session.user.id).then((result) => {
                        if (result === true) {
                            validation.isConfirmed(data.newPassword, data.confirmPassword, "Nouveau mot de passe incorrect");
                        }
                    }).catch((result) => {
                        validation.errors.push(result);
                    });
                }

                if (data.username !== request.session.user.username) {
                    const resultUsername  = await checkDb.checkUsername(data.username);
                    if (resultUsername[0].count !== 0) {
                        validation.errors.push({errorMsg:'Identifiant deja pris'});
                    }
                }
                if (data.email !== request.session.user.email) {
                    const resultEmail = await checkDb.checkEmail(data.email);
                    if (resultEmail[0].count !== 0) {
                        validation.errors.push({errorMsg:'Email deja pris'});
                    }
                }

                if (validation.errors.length === 0) {
                    if (data.newPassword !== '') {
                        console.log("Pass");
                        checkDb.updateInfoWithPass(data, request.session.user.id).then(() => {
                            checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
                                console.log('result THEN :', result);
                                response.json({user: result[0]});
                                request.session.user.username = data.username;
                                request.session.user.email = data.email;
                                request.session.user.password = data.newPassword;

                            }).catch((result) => {
                                console.log('result CATCH:',result);
                            });
                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    } else if (data.newPassword === '') {
                        console.log("No Pass");
                        checkDb.updateInfoWithoutPass(data, request.session.user.id).then(() => {
                            checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
                                console.log('result THEN :', result);
                                response.json({user: result[0]});
                                request.session.user.username = data.username;
                                request.session.user.email = data.email;
                                request.session.user.password = data.newPassword;

                            }).catch((result) => {
                                console.log('result CATCH:',result);
                            });
                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    }

                } else {
                    response.json({errors: validation.errors});
                    validation.errors = [];
                }

            } else if (request.body.submit === 'createProfile') {

                const data = {
                    gender: request.body.gender,
                    birthdate: request.body.birthdate,
                    orientation: request.body.orientation,
                    description: request.body.description,
                };
                await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format de genre");
                await validation.matchingRegex(data.birthdate, /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, "Mauvais format de date de naissance");
                await validation.matchingRegex(data.orientation, /^Hétérosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format d'orientation");
                await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?'"\-_]+$/, "Mauvais format de description");

                if (validation.errors.length === 0) {
                    const sql = "UPDATE matcha.users SET `birth` = CASE WHEN ? = '' THEN NULL ELSE str_to_date(?, '%d/%m/%Y') END, `gender` = ?, orientation = ?, description = ? WHERE users.id = ?";

                    checkDb.query(sql, [data.birthdate, data.birthdate, data.gender, data.orientation, data.description, request.session.user.id]).then(() => {
                        checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
                            response.json({user: result[0]});
                            request.session.user.profil = data;

                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                } else {
                    response.json({errors: validation.errors});
                    validation.errors = [];
                }
            } else if (request.body.submit === 'modifyProfile') {

                const data = {
                    gender: request.body.gender,
                    orientation: request.body.orientation,
                    description: request.body.description,
                };
                await validation.matchingRegex(data.gender, /^Femme|Homme|Homme-Transgenre|Femme-Transgenre$/, "Mauvais format de genre");
                await validation.matchingRegex(data.orientation, /^Hétérosexuel|Homosexuel|Bisexuel|Pansexuel$/, "Mauvais format d'orientation");
                await validation.matchingRegex(data.description, /^[a-zA-Z0-9 !.,:;?'"\-_]+$/, "Mauvais format de description");

                if (validation.errors.length === 0) {
                    const sql = "UPDATE matcha.users SET `gender` = ?, orientation = ?, description = ? WHERE users.id = ?";

                    checkDb.query(sql, [data.gender, data.orientation, data.description, request.session.user.id]).then(() => {
                        checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
                            response.json({user: result[0]});

                        }).catch((result) => {
                            console.log('result CATCH:',result);
                        });
                    }).catch((result) => {
                        console.log('result CATCH:',result);
                    });
                } else {
                    response.json({errors: validation.errors});
                    validation.errors = [];
                }
            } else {

                //pour avoir une info spp sur le POST de files : request.body.submit a l'interieur d'upload() // En ajax, formData.append('submit', valeur)
                upload(request, response, (error) => {
                    if (error) {
                        response.json({errors: error.message});
                    } else {
                        if (request.file === undefined) {
                            response.json({errors: 'No file selected !'});
                        } else {
                            console.log('file :',request.file.filename);
                            response.json({file: `uploads/${request.file.filename}`});
                        }
                    }
                });

            }
        });

		/* Routes for search */

        this.app.get('/search', (request, response) => {
			if (!request.session.user) {
                return response.render('index');
			} else {
				checkDb.setOrientation(request.session.user.id).then((filter) => {
					checkDb.getAllUsers(filter, request.query.sort).then((users) => {
						if (!request.query.index) {
							checkDb.getLikes(request.session.user.id).then((likes) => {
								// console.log(likes);
								response.render('pages/search', {
									users: users,
									index: 0,
									likes: likes
								});
							}).catch((likes) => {
								response.render('pages/search', {
									users: users,
									index: 0,
									likes: likes,
								});
							});
						} else {
							if (request.query.index < users.length){
								checkDb.getLikes(request.session.user.id).then((likes) => {
									response.render('pages/search', {
										users: users,
										index: request.query.index,
										likes: likes
									});
								}).catch((likes) => {
									response.render('pages/search', {
										users: users,
										index: request.query.index,
										likes: likes,
									});
								});
							} else {
								response.end();
							}
						}
					}).catch((users) => {
						return response.render('index');
					});
				}).catch((filter) => {
					return response.render('index');
				});					
			}
        }).post('/search', async(request, response) => {
            console.log("Je suis dans LIKE");
            console.log("body", request.body.id_liked);
            // console.log(request.body.dataType);
			return response.render('index');
        });
		
		/* Routes for ... */

    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;