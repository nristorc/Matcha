

const databaseRequest = require("../models/databaseRequest");
const checkDb = new databaseRequest();

const registerValidation = require('../models/registerValidation');
let validation = new registerValidation();

const userDatabase =require('../models/userData');
const userData = new userDatabase();

const multer = require('multer');
const path = require('path');

const fs = require('fs');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (request, file, callback) {
        callback(null, request.session.user.id + '-' + Date.now() + path.extname(file.originalname));
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
			    // console.log('user THEN: ', user);
				checkDb.getTags(request.session.user.id).then((tags) => {
                    // console.log('tags THEN: ', tags);
				    checkDb.getPhotos(request.session.user.id).then((photos) => {
                        // console.log('photos THEN: ', photos);
                        // console.log('get DB age', user[0]['birth']);
                        userData.userAge(user[0]['birth']).then((age) => {
                            console.log('age THEN: ', age);
                            response.render('pages/profil', {
                                user: user,
                                userage: age,
                                usertags: tags,
                                userphotos: photos
                            });
                        }).catch((age) => {
                            // console.log('age CATCH: ', age);
                            response.render('pages/profil', {
                                user: user,
                                usertags: tags,
                                userage: null,
                                userphotos: photos
                            });
                        });
                    }).catch((photos) => {
                        // console.log('photos CATCH: ', photos);
                        response.render('pages/profil', {
                            user: user,
                            usertags: tags,
                            userage: null,
                            userphotos: null
                        });
                    });
				}).catch((tags) => {
                    // console.log('tags CATCH: ', tags);
                    response.render('pages/profil', {
                        user: user,
                        usertags: tags,
                        userage: null,
                        userphotos: photos
                    });
                });
			}).catch((user) => {
                // console.log('user CATCH: ', user);
                response.render('index');
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
                        checkDb.updateInfoWithPass(data, request.session.user.id).then(() => {
                            checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
                                //console.log('result THEN :', result);
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
                        checkDb.updateInfoWithoutPass(data, request.session.user.id).then(() => {
                            checkDb.query("SELECT * FROM matcha.users WHERE id = ?", [request.session.user.id]).then((result) => {
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
            } else if (request.body.submit === 'updateProfilPic') {

                checkDb.checkProfilPic(request.session.user.id).then((result) => {
                    const imagePath = request.body.image.substring(22);
                    if (result && result.picture) {
                        if (result.picture === imagePath) {
                            response.json({message: 'Cette photo est déja votre photo de profil'});
                        } else {
                            checkDb.updateProfilPic(imagePath, request.session.user.id).then((result) => {
                                if (result) {
                                    response.json({image: imagePath, message: 'Votre photo de profil a bien été mise à jour'});
                                }
                            }).catch((result) => {
                                response.json({errors: "Une erreur s'est produite: " + result});
                            });
                        }
                    }
                }).catch((result) => {
                    response.json({errors: "Une erreur s'est produite: " + result});
                });

            } else if (request.body.submit === 'deletePic') {

                console.log('image node: ',request.body.image);

                checkDb.checkProfilPic(request.session.user.id).then((result) => {
                    const imagePath = request.body.image.substring(22);
                    if (result && result.picture) {
                        if (result.picture === imagePath) {

                            //console.log('image path profil', imagePath);
                            checkDb.updateProfilPic('public/img/avatarDefault.png', request.session.user.id).then((result) => {
                                if (result) {
                                    checkDb.deletePhoto(request.session.user.id, imagePath).then((deleteRes) => {
                                        //console.log('image path delete', imagePath);
                                        fs.unlink(imagePath, (err) => {
                                            if (err) throw err;
                                            console.log('successfully deleted '+ imagePath);
                                        });
                                        //console.log('image path response', imagePath);
                                        response.json({image: imagePath, message: 'Votre photo a bien été supprimée', flag: 'profil'});
                                    }).catch((deleteRes) => {
                                        response.json({errors: "Une erreur s'est produite: " + deleteRes});
                                    });
                                }
                            }).catch((result) => {
                                response.json({errors: "Une erreur s'est produite: " + result});
                            });

                        } else {
                            checkDb.deletePhoto(request.session.user.id, imagePath).then((deleteRes) => {
                                fs.unlink(imagePath, (err) => {if (err) throw err;
                                    console.log('successfully deleted '+ imagePath);
                                });
                                response.json({image: imagePath, message: 'Votre photo a bien été supprimée'});
                            }).catch((deleteRes) => {
                                response.json({errors: "Une erreur s'est produite: " + deleteRes});
                            });
                        }
                    }
                }).catch((result) => {
                    response.json({errors: "Une erreur s'est produite: " + result});
                });


            } else {
                fs.readdir('public/uploads/', (err, items) => {
                    var i = 0;
                    while (items[i] && items[i].split('-')[0] == request.session.user.id) {
                        i++;
                    }
                    if (i >= 5) {
                        response.json({errors: 'Nombre maximum de photos uploadées atteint'});
                    } else {
                        upload(request, response, (error) => {
                            if (error) {
                                response.json({errors: error.message});
                            } else {
                                if (request.file === undefined) {
                                    response.json({errors: 'No file selected !'});
                                }
                                else {
                                    //console.log('request file path: ',request.file.path);
                                    checkDb.insertPhoto(request.session.user.id, request.file.path).then((result) => {
                                        //console.log('result THEN insert: ', result);
                                        if (result) {
                                            //console.log('1- nouvelle photo uploade');
                                            checkDb.checkProfilPic(request.session.user.id).then((resultFlag) => {
                                            //console.log('2- checkPic: ',result);
                                                if (resultFlag && resultFlag.flag === 0) {
                                                    //console.log('3- je vais updater la db');
                                                    checkDb.updateProfilPic(request.file.path, request.session.user.id).then((result) => {
                                                        //console.log('4- result update: ', result);
                                                        //console.log("5- je renvoie a l'ajax // Db Update DONE");
                                                        response.json({file: request.file.path, flag: resultFlag.flag});
                                                    }).catch((result) => {
                                                        console.log('result CATCH update: ', result);
                                                        response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb UPDATE"});
                                                    });
                                                } else if (resultFlag && resultFlag.flag === 1) {
                                                   // console.log("3bis- pas d'update de la DB profil");
                                                    //console.log("5- je renvoie a l'ajax // Db Update NO");
                                                    response.json({file: request.file.path, flag: resultFlag.flag});
                                                }
                                            }).catch((result) => {
                                                console.log('result CATCH checkphoto: ', result);
                                                response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb CHECK"});
                                            });
                                        }
                                    }).catch((result) => {
                                        console.log('result CATCH insert: ', result);
                                        response.json({errors: "Une erreur s'est produite, merci de réitérer votre demande ultérieurement // Pb INSERT"});
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });

		/* Routes for search */

        this.app.get('/search', (request, response) => {
			if (!request.session.user) {
                return response.render('index');
			} else {
				var sort = request.query.sort;
				if (sort == "popAsc"){
					sort = " ORDER by `popularity` ASC";
				} else if (sort == "popDesc"){
					sort = " ORDER by `popularity` DESC";
				} else if (sort == "ageAsc"){
					sort = " ORDER by `birth` ASC";
				} else if (sort == "ageDesc"){
					sort = " ORDER by `birth` DESC";
				} else if (sort == "loc"){
					sort = " ORDER by `birth` DESC";
                }
                var filter = request.query.filter;
                if (filter != undefined){                    
                    var ageFilter = filter.substring(3, filter.indexOf("pop"));
					var popFilter = filter.substring(filter.indexOf("pop") + 3, filter.indexOf("loc"));
					var locFilter = filter.substring(filter.indexOf("loc") + 3);
                    var ageMin = ageFilter.substring(0, ageFilter.indexOf(","));
                    var ageMax = ageFilter.substring(ageFilter.indexOf(",")+1);
                    if (ageMin == ageMax){
                        ageMin -= 1;
                    }
					ageMin = userData.ageConvert(ageMin).then((dateMin) => {
						ageMin = dateMin;
						console.log(ageMin);

					}).catch((error)=>{
						console.log(error);
					});
					userData.ageConvert(ageMax).then((dateMax) => {
						ageMax = dateMax;
						console.log(ageMax);
					}).catch((error)=>{
						console.log(error);
					});                   
					var popMin = popFilter.substring(0, popFilter.indexOf(","));
					var popMax = popFilter.substring(popFilter.indexOf(",")+1);
					var locMin = locFilter.substring(0, locFilter.indexOf(","));
                    var locMax = locFilter.substring(locFilter.indexOf(",")+1);
                    filter = " AND `birth` BETWEEN " + ageMin + " AND " + ageMax + " AND `popularity` BETWEEN " + popMin + " AND " + popMax;
				}
                // console.log(filter);
				checkDb.setOrientation(request.session.user.id).then((orientation) => {
                    checkDb.getAllUsers(orientation, filter).then((users) => {
                        // console.log(orientation, sort);
                        if (!request.query.index) {
							checkDb.getLikes(request.session.user.id).then((likes) => {
								response.render('pages/search', {
									users: users,
									index: 0,
                                    likes: likes,
								});
							}).catch((likes) => {
								response.render('pages/search', {
									users: users,
									index: 0,
									likes: likes,
								});
							});
						} else {
                            console.log("--2--");
                            console.log(request.query.index)
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
				}).catch((orientation) => {
					return response.render('index');
				});					
			}
        }).post('/search', async(request, response) => {
            if (!request.session.user) {
                return response.render('index');
			} else {
                var data = request.body.id_liked;
				var likeAction = data.substring(0, 12);
                var userLiked =  data.substring(13, data.length);
				if (likeAction == "oklikeSearch"){
					checkDb.updateLikes(request.session.user.id, userLiked, 1).then((update) => {
					});
				} else if (likeAction == "unlikeSearch"){
					checkDb.updateLikes(request.session.user.id, userLiked, -1).then((update) => {
					});
				}
			}
		});

		/* Routes for TestTags */
        this.app.get('/tags', (request, response) => {
            if (!request.session.user) {
                return response.render('index');
            }
            checkDb.getUser(request.session.user.username).then((user) => {
                checkDb.getTags(request.session.user.id).then((tags) => {
                    response.render('pages/testTags', {
                        user: user,
                        usertags: tags,
                            });
                }).catch((tags) => {
                    response.render('pages/testTags', {
                        user: user,
                        usertags: tags,
                    });
                });
            }).catch((user) => {
                response.render('index');
            });
        })

    }

    routesConfig(){
        this.appRoutes();
    }
}
module.exports = Routes;