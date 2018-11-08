'use strict';

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();

const userDatabase =require('../models/userData');
const userData = new userDatabase();

class Routes{
    constructor(app){
        this.app = app;
    }

    appRoutes(){
        this.app.get('/', async (request,response) => {
            if (!request.session.user) {
                //console.log('session KO: ', request.session);
                response.status(200).render('index');
            } else {
                //console.log('session OK: ', request.session);
                response.status(200).render('pages/dashboard');
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
                        console.log(request.session.user);
                        request.flash(loginResponse.type, loginResponse.message);
                        response.status(200).redirect('/profil');//.render('pages/profil', {
                            //username: data.username,
                            //password: data.password,
                            //message: loginResponse.message
                        //});
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
                    //console.log('on passe au check db !');
                    const resultUsername  = await checkDb.checkUsername(data.username);
                    const resultEmail = await checkDb.checkEmail(data.email);
                    //console.log('count db username: ', resultUsername[0].count);
                    //console.log('count db email: ', resultEmail[0].count);

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
            const loginResponse = {};
            checkDb.checkRegisterToken(request.params.registerToken).then((result) => {
                const data = {
                    username: result[0].username,
                    password: result[0].password
                };
                loginResponse.error = false;
                loginResponse.userId = result[0].id;
                loginResponse.message = `User logged in.`;
                request.session.user = data;
                response.status(200).render('pages/loggedIn', {
                    username: data.username,
                    password: data.password,
                    message: loginResponse.message
                });
            }).catch(() => {
                loginResponse.error = true;
                loginResponse.message = `Token not valid`;
                console.log('Token not valid');
                response.status(401).render('index');
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

        this.app.get('/loggedIn', (request, response) => {
            console.log(request.session);
            console.log(request.session.user);
            if (!request.session.user) {
                console.log('pas de session');
                return response.status(401).send();
            }
            console.log('1 session');
            return response.status(200).send('Welcome to your Dashboard !');
        });

        this.app.get('/logout', function(request, result){
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

        this.app.get('/profil', (request, response) => {
            if (!request.session.user) {
                return response.render('index');
			}
			checkDb.getUser(request.session.user.username).then((user) => {
				checkDb.getTags(request.session.user.id).then((tags) => {
					console.log(tags);
					userData.userAge(user[0]['birth']).then((age) => {
						response.render('pages/profil', {
						user: user,
						userage: age,
						usertags: tags
						});
					}).catch((age) => {
						response.render('pages/profil', {
						user: user,
						usertags: tags,
						userage: null
						});
					});
				});
			});
		});	

		/* Routes for Search */

        this.app.get('/search', (request, response) => {
            if (!request.session.user) {
                return response.render('index');
			}
			checkDb.getAllUsers().then((users) => {
				// console.log(users);
				response.render('pages/search', {
				users: users,
				});
			}).catch((users) => {
				// console.log(users);
				response.render('pages/search', {
				users: users,
				});
			});
        });
        

		/* Routes for infinite */

        this.app.get('/search-infinite', (request, response) => {
			if (!request.session.user) {
                return response.render('index');
			} else {
                console.log(request.query.index);
				checkDb.getAllUsers().then((users) => {
					response.render('pages/search-infinite', {
                    users: users,
                    index: request.query.index
					});
				}).catch((users) => {
					// console.log(users);
					response.render('index',{
					users: users,
					});
				});
			}
		});
		
				/* Routes for Test */

				this.app.get('/test', (request, response) => {
					if (!request.session.user) {
						return response.render('index');
					}
					checkDb.getAllUsers().then((users) => {
						console.log(users);
						response.render('pages/test', {
						users: users,
						});
					}).catch((users) => {
						console.log(users);
						response.render('pages/test', {
						users: users,
						});
					});
				});
				
		
				/* Routes for infinite-test */
		
				this.app.get('/test2', (request, response) => {
					if (!request.session.user) {
						return response.render('index');
					} else {
						checkDb.getAllUsers().then((users) => {
							response.render('pages/test2', {
							users: users,
							});
						}).catch((users) => {
							console.log(users);
							response.render('index',{
							users: users,
							});
						});
					}
				});

		/* Routes for ... */

    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;